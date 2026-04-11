-- Allow nullable role and full_name for phone-based OTP registration flow
-- Per BRD EP01: user registers with phone only, selects role and sets name in subsequent steps

alter table public.users alter column role drop not null;
alter table public.users alter column role drop default;
alter table public.users alter column full_name drop not null;
