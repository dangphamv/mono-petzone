-- Computed column exposing the number of orders per provider.
-- PostgREST surfaces this as `order_count` on the providers resource, so the
-- admin list can both display it and sort by it (select=...,order_count &
-- order=order_count.desc) without a denormalized counter that can drift.
create or replace function public.order_count(public.providers)
returns bigint
language sql
stable
as $$
  select count(*) from public.orders where orders.provider_id = $1.id;
$$;
