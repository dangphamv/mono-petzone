-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  method varchar(20) not null check (method in ('momo', 'zalopay', 'vnpay', 'bank_transfer')),
  amount decimal(12,0) not null check (amount > 0),
  status varchar(30) not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  transaction_ref varchar(255),
  gateway_response jsonb,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount decimal(12,0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments(order_id);
create index payments_status_idx on public.payments(status) where status = 'pending';
create index payments_ref_idx on public.payments(transaction_ref) where transaction_ref is not null;

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at();

-- Escrow ledger
create table public.escrow_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  type varchar(10) not null check (type in ('hold', 'release', 'refund')),
  amount decimal(12,0) not null,
  balance_after decimal(12,0) not null,
  description text,
  created_at timestamptz not null default now()
);

create index escrow_order_idx on public.escrow_ledger(order_id, created_at);

-- Provider payouts
create table public.provider_payouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id),
  order_id uuid not null references public.orders(id),
  gross_amount decimal(12,0) not null,
  commission_rate decimal(5,4) not null,
  commission_amount decimal(12,0) not null,
  net_amount decimal(12,0) not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payout_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_provider_idx on public.provider_payouts(provider_id, created_at desc);
create index payouts_status_idx on public.provider_payouts(status) where status in ('pending', 'processing');

create trigger payouts_updated_at
  before update on public.provider_payouts
  for each row execute function public.update_updated_at();

-- Refunds
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  payment_id uuid not null references public.payments(id),
  amount decimal(12,0) not null check (amount > 0),
  type varchar(10) not null check (type in ('full', 'partial')),
  reason text not null,
  status varchar(20) not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  processed_by uuid not null references public.users(id),
  gateway_response jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index refunds_order_idx on public.refunds(order_id);
