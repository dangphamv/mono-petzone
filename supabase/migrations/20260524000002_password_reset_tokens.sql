-- Custom password-reset tokens (SendGrid flow). We store only a SHA-256 hash of the
-- raw token; the raw token is emailed once and never persisted. Single-use + expiring.
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_hash_idx on public.password_reset_tokens(token_hash);
create index if not exists password_reset_tokens_user_idx on public.password_reset_tokens(user_id);

-- Service-role only (API). No policies → no anon/authenticated access; service role bypasses RLS.
alter table public.password_reset_tokens enable row level security;
