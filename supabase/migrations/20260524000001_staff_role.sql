-- Add a 'staff' role below 'admin' with granular per-account permissions.
-- Admin stays superuser (full access); staff only gets the permissions an admin grants.

-- 1. Allow 'staff' in the role CHECK (inline constraint is auto-named users_role_check).
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('owner', 'provider', 'admin', 'staff'));

-- 2. Granular permissions (only meaningful for staff; empty for everyone else).
alter table public.users
  add column if not exists permissions text[] not null default '{}';
