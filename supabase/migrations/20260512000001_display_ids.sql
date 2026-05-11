-- Short, human-friendly display IDs for users, providers, pets.
-- Derived deterministically from each row's UUID primary key so no backfill,
-- sequence, or trigger is needed. Postgres recomputes the value on insert.
--
-- Format: PZ-{U|P|T}{first 6 hex chars of UUID, uppercase}
-- Example: user 1a2b3c4d-... → PZ-U1A2B3C
--
-- This is a presentation-only identifier. The UUID `id` remains the primary
-- key and the source of truth.

alter table public.users
  add column if not exists display_id varchar(16)
  generated always as (
    'PZ-U' || upper(replace(substring(id::text, 1, 6), '-', ''))
  ) stored;

alter table public.providers
  add column if not exists display_id varchar(16)
  generated always as (
    'PZ-P' || upper(replace(substring(id::text, 1, 6), '-', ''))
  ) stored;

alter table public.pets
  add column if not exists display_id varchar(16)
  generated always as (
    'PZ-T' || upper(replace(substring(id::text, 1, 6), '-', ''))
  ) stored;

create index if not exists users_display_id_idx on public.users(display_id);
create index if not exists providers_display_id_idx on public.providers(display_id);
create index if not exists pets_display_id_idx on public.pets(display_id);
