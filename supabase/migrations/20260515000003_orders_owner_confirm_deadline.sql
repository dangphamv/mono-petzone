-- =====================================================
-- Owner confirm-receive deadline (payments v1 only).
-- After provider check_out, owner has 24h to confirm
-- receipt. If they don't act, a cron worker auto-completes
-- the order. Mirrors provider_response_deadline pattern.
-- v2 orders are driven by the provider on check_out and
-- do not use this deadline.
-- =====================================================

alter table public.orders
  add column if not exists owner_confirm_deadline timestamptz;

create index if not exists orders_owner_confirm_deadline_idx
  on public.orders(owner_confirm_deadline)
  where status = 'check_out' and owner_confirm_deadline is not null;
