alter table public.orders
  drop constraint if exists orders_cancelled_by_check;

alter table public.orders
  alter column cancelled_by type varchar(10);

alter table public.orders
  add constraint orders_cancelled_by_check
  check (cancelled_by in ('owner', 'provider', 'admin', 'system'));
