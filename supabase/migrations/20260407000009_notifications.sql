-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(30) not null check (type in (
    'order_status', 'new_message', 'status_report', 'payment',
    'emergency', 'review', 'verification', 'reminder_report',
    'reminder_review', 'system', 'promotion'
  )),
  title varchar(200) not null,
  body text not null,
  data jsonb,
  is_read boolean not null default false,
  push_sent boolean not null default false,
  email_sent boolean not null default false,
  sms_sent boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id, is_read) where is_read = false;

-- Device tokens for push notifications
create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token varchar(500) not null,
  platform varchar(10) not null check (platform in ('ios', 'android', 'web')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

create index device_tokens_user_idx on public.device_tokens(user_id) where is_active = true;

create trigger device_tokens_updated_at
  before update on public.device_tokens
  for each row execute function public.update_updated_at();

-- Notification delivery log
create table public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel varchar(10) not null check (channel in ('push', 'email', 'sms')),
  status varchar(20) not null check (status in ('sent', 'delivered', 'failed', 'bounced')),
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create index delivery_log_notification_idx on public.notification_delivery_log(notification_id);
