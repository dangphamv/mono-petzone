-- =====================================================
-- Payments v1: VietQR direct-to-provider flow.
-- Owner scans QR → chuyển khoản trực tiếp tới provider.
-- PetZone không cầm tiền (zero-collection model).
-- Webhook verify qua SePay/Casso.
--
-- v2 flow KHÔNG bị ảnh hưởng — chỉ chạm tables v1.
-- =====================================================

-- 1. Add 'vietqr' to payments.method enum
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('momo', 'zalopay', 'vnpay', 'bank_transfer', 'vietqr'));

-- 2. Bank transactions log — every inbound notification from SePay/Casso
--    lands here. Matched ones get linked to payments via matched_payment_id.
create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  source varchar(20) not null check (source in ('sepay', 'casso', 'manual')),
  source_event_id varchar(100),                   -- external id for idempotency
  bank_brand varchar(50),                          -- 'Vietcombank', 'BIDV', ...
  account_number varchar(50) not null,             -- account that received
  amount decimal(12,0) not null,
  content text not null,                            -- transfer memo
  reference_code varchar(100),                      -- bank's internal tx id
  transfer_type varchar(10) not null check (transfer_type in ('in', 'out')),
  occurred_at timestamptz not null,
  matched_payment_id uuid references public.payments(id),
  matched_order_number varchar(20),                 -- parsed from content even if no match yet
  matched_at timestamptz,
  raw_payload jsonb not null,
  signature_valid boolean not null,
  created_at timestamptz not null default now()
);

create index bank_tx_account_idx
  on public.bank_transactions(account_number, occurred_at desc);
create unique index bank_tx_source_event_uniq
  on public.bank_transactions(source, source_event_id)
  where source_event_id is not null;
create index bank_tx_unmatched_idx
  on public.bank_transactions(created_at)
  where matched_payment_id is null and transfer_type = 'in';
create index bank_tx_order_idx
  on public.bank_transactions(matched_order_number)
  where matched_order_number is not null;

-- 3. v1 commission config (separate from v2 — v2 keeps its hardcoded rate).
--    Trial period: 0% to attract providers/owners.
--    Store as JSON number (not "0" string) so admin config service reads
--    it back as a number for the z.number() validator.
insert into public.app_config (key, value)
values ('commission_rate_v1', '0'::jsonb)
on conflict (key) do nothing;

-- 4. Enable VietQR by default for v1 (admin can disable via /admin/config UI)
insert into public.app_config (key, value)
values ('vietqr_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- 5. RLS — bank_transactions: admin/service only
alter table public.bank_transactions enable row level security;
-- (no policies = service role only, which is correct for webhook-only writes)
