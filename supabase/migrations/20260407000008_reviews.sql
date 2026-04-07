-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  owner_id uuid not null references public.users(id),
  provider_id uuid not null references public.providers(id),
  rating_overall int not null check (rating_overall between 1 and 5),
  rating_cleanliness int check (rating_cleanliness between 1 and 5),
  rating_care_quality int check (rating_care_quality between 1 and 5),
  rating_communication int check (rating_communication between 1 and 5),
  rating_value int check (rating_value between 1 and 5),
  text text,
  photos text[] not null default '{}',
  provider_response text,
  provider_responded_at timestamptz,
  is_visible boolean not null default true,
  hidden_reason text,
  hidden_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_provider_idx on public.reviews(provider_id, created_at desc);
create index reviews_provider_rating_idx on public.reviews(provider_id, rating_overall);
create index reviews_owner_idx on public.reviews(owner_id);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.update_updated_at();

-- Auto-update provider rating when review is inserted or updated
create or replace function public.update_provider_rating()
returns trigger as $$
begin
  update public.providers
  set
    rating_average = coalesce((
      select round(avg(rating_overall)::numeric, 2)
      from public.reviews
      where provider_id = coalesce(new.provider_id, old.provider_id)
        and is_visible = true
    ), 0),
    rating_count = (
      select count(*)
      from public.reviews
      where provider_id = coalesce(new.provider_id, old.provider_id)
        and is_visible = true
    )
  where id = coalesce(new.provider_id, old.provider_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger reviews_update_provider_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_provider_rating();
