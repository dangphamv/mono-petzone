-- =====================================================
-- Payments v1: add recipient split (provider | petzone)
-- Mirrors v2's provider_payouts_v2.recipient column so v1
-- payouts also reflect the two-leg split into PetZone
-- commission + provider net.
-- =====================================================

alter table public.provider_payouts
  add column if not exists recipient varchar(10);

-- Backfill: any pre-existing row represents the provider's net payout.
update public.provider_payouts
  set recipient = 'provider'
  where recipient is null;

alter table public.provider_payouts
  alter column recipient set not null;

alter table public.provider_payouts
  drop constraint if exists provider_payouts_recipient_check;

alter table public.provider_payouts
  add constraint provider_payouts_recipient_check
  check (recipient in ('provider', 'petzone'));

-- One pair (provider+petzone) per order
create unique index if not exists payouts_order_recipient_uniq
  on public.provider_payouts(order_id, recipient);
