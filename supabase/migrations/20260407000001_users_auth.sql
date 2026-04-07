-- Users profile table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone varchar(15),
  email varchar(255),
  full_name varchar(100) not null,
  avatar_url varchar(500),
  role varchar(20) not null default 'owner' check (role in ('owner', 'provider', 'admin')),
  status varchar(30) not null default 'active' check (status in ('active', 'suspended', 'banned', 'pending_verification')),
  social_provider varchar(20) check (social_provider in ('google', 'facebook', 'apple', 'zalo')),
  social_id varchar(255),
  notification_preferences jsonb not null default '{}',
  terms_accepted_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_phone_unique on public.users(phone) where phone is not null;
create unique index users_email_unique on public.users(email) where email is not null;
create index users_role_status_idx on public.users(role, status);

-- OTP verification
create table public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone varchar(15) not null,
  otp_hash varchar(255) not null,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create index otp_phone_idx on public.otp_verifications(phone, is_used);

-- Refresh tokens
create table public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash varchar(255) not null,
  device_info jsonb,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index refresh_tokens_user_idx on public.refresh_tokens(user_id);
create index refresh_tokens_hash_idx on public.refresh_tokens(token_hash);

-- Updated at trigger function (reused across tables)
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();
