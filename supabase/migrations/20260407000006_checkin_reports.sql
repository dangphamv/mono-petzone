-- Check-in photos (immutable after creation)
create table public.check_in_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  uploaded_by uuid not null references public.users(id),
  role varchar(10) not null check (role in ('owner', 'provider')),
  handoff_point varchar(30) not null check (handoff_point in (
    'owner_to_store', 'store_to_owner'
  )),
  photo_url varchar(500) not null,
  thumbnail_url varchar(500),
  timestamp timestamptz not null default now(),
  latitude decimal(10,8),
  longitude decimal(11,8),
  has_concern boolean not null default false,
  concern_note text,
  created_at timestamptz not null default now()
);

create index checkin_photos_order_idx on public.check_in_photos(order_id, created_at);

-- Immutability trigger: prevent updates and deletes on check-in photos
create or replace function public.prevent_checkin_photo_modification()
returns trigger as $$
begin
  raise exception 'Check-in photos are immutable and cannot be modified or deleted';
end;
$$ language plpgsql;

create trigger checkin_photos_immutable_update
  before update on public.check_in_photos
  for each row execute function public.prevent_checkin_photo_modification();

create trigger checkin_photos_immutable_delete
  before delete on public.check_in_photos
  for each row execute function public.prevent_checkin_photo_modification();

-- Daily status reports
create table public.status_reports (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider_id uuid not null references public.providers(id),
  photos text[] not null default '{}',
  feeding_status varchar(20) not null check (feeding_status in ('normal', 'eating_less', 'not_eating')),
  activity_summary text not null,
  note text,
  owner_reaction varchar(20) check (owner_reaction in ('heart', 'thumbs_up')),
  owner_reply text,
  owner_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index status_reports_order_idx on public.status_reports(order_id, created_at desc);

create trigger status_reports_updated_at
  before update on public.status_reports
  for each row execute function public.update_updated_at();

-- Report reminders
create table public.report_reminders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider_id uuid not null references public.providers(id),
  reminder_date date not null,
  sent_at timestamptz,
  unique(order_id, reminder_date)
);

create index report_reminders_pending_idx on public.report_reminders(reminder_date) where sent_at is null;
