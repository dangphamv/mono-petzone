-- =====================================================
-- Payments v2: PSP-mediated escrow + split-payout
-- Runs in parallel to v1 (apps/api/src/modules/payments).
-- Selected per-order via orders.payment_version.
-- =====================================================

-- App config (referenced by AdminConfigService but never created)
create table if not exists public.app_config (
  key varchar(100) primary key,
  value jsonb not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

-- Order routing flag (v1 by default; backfill not needed)
alter table public.orders
  add column if not exists payment_version smallint not null default 1
    check (payment_version in (1, 2));

create index if not exists orders_payment_version_idx
  on public.orders(payment_version)
  where payment_version = 2;

-- Provider bank account (required for v2 disbursement)
alter table public.providers
  add column if not exists bank_name varchar(100),
  add column if not exists bank_account_number_encrypted text,
  add column if not exists bank_account_holder varchar(200),
  add column if not exists bank_verified_at timestamptz,
  add column if not exists bank_verified_by uuid references public.users(id);

-- v2 payment header (one per order; PSP holds the money)
create table public.payments_v2 (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  owner_id uuid not null references public.users(id),
  provider_id uuid not null references public.providers(id),
  amount decimal(12,0) not null check (amount > 0),
  currency varchar(3) not null default 'VND',
  psp_provider varchar(20) not null default '9pay',
  psp_order_id varchar(255) not null unique,
  psp_payment_url text,
  method varchar(20) check (method in ('momo', 'zalopay', 'vnpay', 'card', 'bank_transfer')),
  status varchar(30) not null default 'awaiting_payment'
    check (status in ('awaiting_payment','captured','split_pending','split_completed','split_failed','refunded')),
  captured_at timestamptz,
  split_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_v2_order_idx on public.payments_v2(order_id);
create index payments_v2_status_idx on public.payments_v2(status)
  where status in ('awaiting_payment','captured','split_pending','split_failed');
create index payments_v2_psp_order_idx on public.payments_v2(psp_order_id);

create trigger payments_v2_updated_at
  before update on public.payments_v2
  for each row execute function public.update_updated_at();

-- v2 escrow ledger (local mirror of PSP balance movements)
create table public.escrow_ledger_v2 (
  id uuid primary key default gen_random_uuid(),
  payment_v2_id uuid not null references public.payments_v2(id) on delete cascade,
  type varchar(10) not null check (type in ('hold', 'release', 'refund')),
  amount decimal(12,0) not null,
  balance_after decimal(12,0) not null,
  psp_reference varchar(255),
  description text,
  created_at timestamptz not null default now()
);

create index escrow_v2_payment_idx on public.escrow_ledger_v2(payment_v2_id, created_at);

-- v2 payouts (one row per leg: provider + petzone)
create table public.provider_payouts_v2 (
  id uuid primary key default gen_random_uuid(),
  payment_v2_id uuid not null references public.payments_v2(id) on delete cascade,
  provider_id uuid not null references public.providers(id),
  recipient varchar(10) not null check (recipient in ('provider', 'petzone')),
  gross_amount decimal(12,0) not null,
  commission_rate decimal(5,4) not null,
  commission_amount decimal(12,0) not null,
  net_amount decimal(12,0) not null,
  bank_account_snapshot jsonb not null,
  psp_disbursement_id varchar(255) unique,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'dispatched', 'completed', 'failed')),
  failure_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_v2_payment_idx on public.provider_payouts_v2(payment_v2_id);
create index payouts_v2_provider_idx on public.provider_payouts_v2(provider_id, created_at desc);
create index payouts_v2_status_idx on public.provider_payouts_v2(status)
  where status in ('pending', 'dispatched');

create trigger payouts_v2_updated_at
  before update on public.provider_payouts_v2
  for each row execute function public.update_updated_at();

-- Disbursement outbox (at-least-once delivery, drained by cron worker)
create table public.psp_outbox_v2 (
  id uuid primary key default gen_random_uuid(),
  payment_v2_id uuid not null references public.payments_v2(id) on delete cascade,
  payout_v2_id uuid references public.provider_payouts_v2(id) on delete cascade,
  kind varchar(30) not null check (kind in ('disburse_provider', 'disburse_petzone', 'refund')),
  payload jsonb not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'dispatched', 'completed', 'failed')),
  attempts int not null default 0,
  last_error text,
  scheduled_at timestamptz not null default now(),
  dispatched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index outbox_v2_due_idx on public.psp_outbox_v2(scheduled_at)
  where status = 'pending';
create index outbox_v2_payment_idx on public.psp_outbox_v2(payment_v2_id);

-- Webhook audit log (raw IPN bodies; idempotency lookup)
create table public.psp_webhook_log (
  id uuid primary key default gen_random_uuid(),
  psp_provider varchar(20) not null,
  kind varchar(30) not null,
  raw_body text not null,
  headers jsonb,
  signature_valid boolean not null,
  psp_event_id varchar(255),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index psp_webhook_event_idx on public.psp_webhook_log(psp_provider, psp_event_id)
  where psp_event_id is not null;
create index psp_webhook_recent_idx on public.psp_webhook_log(created_at desc);

-- RLS
alter table public.payments_v2 enable row level security;
alter table public.escrow_ledger_v2 enable row level security;
alter table public.provider_payouts_v2 enable row level security;
alter table public.psp_outbox_v2 enable row level security;
alter table public.psp_webhook_log enable row level security;
alter table public.app_config enable row level security;

-- payments_v2: owner reads own, provider reads own, admin all. Service role bypasses RLS.
create policy payments_v2_owner_read on public.payments_v2
  for select using (owner_id = auth.uid());

create policy payments_v2_provider_read on public.payments_v2
  for select using (
    provider_id in (select id from public.providers where user_id = auth.uid())
  );

-- payouts_v2: provider reads own; admin via service role
create policy payouts_v2_provider_read on public.provider_payouts_v2
  for select using (
    provider_id in (select id from public.providers where user_id = auth.uid())
  );

-- escrow_ledger_v2: same visibility as parent payment
create policy escrow_v2_read on public.escrow_ledger_v2
  for select using (
    payment_v2_id in (
      select id from public.payments_v2
      where owner_id = auth.uid()
         or provider_id in (select id from public.providers where user_id = auth.uid())
    )
  );

-- outbox and webhook log: no end-user access (service role only)
-- app_config: no end-user access (admin via service role only)
