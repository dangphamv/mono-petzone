-- =====================================================
-- Payment gateway webhook (IPN) log for v1.
-- Every inbound IPN — verified or not — gets a row.
-- gateway_event_id + unique index gives at-least-once
-- → exactly-once processing.
-- =====================================================

create table public.payments_webhook_log (
  id uuid primary key default gen_random_uuid(),
  gateway varchar(20) not null check (gateway in ('momo', 'zalopay', 'vnpay')),
  kind varchar(20) not null check (kind in ('collection', 'refund')),
  raw_body jsonb not null,
  headers jsonb,
  signature_valid boolean not null,
  gateway_event_id varchar(255),
  payment_id uuid references public.payments(id),
  parse_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Idempotency: only one *processed* event per gateway+event_id.
-- Unprocessed rows (invalid sig, parse fail) don't claim the slot.
create unique index payments_webhook_log_event_uniq
  on public.payments_webhook_log(gateway, gateway_event_id)
  where gateway_event_id is not null and processed_at is not null;

create index payments_webhook_log_payment_idx
  on public.payments_webhook_log(payment_id)
  where payment_id is not null;

create index payments_webhook_log_unprocessed_idx
  on public.payments_webhook_log(created_at)
  where processed_at is null;
