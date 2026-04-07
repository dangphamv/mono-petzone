-- Disputes
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  opened_by uuid not null references public.users(id),
  opened_by_role varchar(10) not null check (opened_by_role in ('owner', 'provider')),
  description text not null,
  evidence_photos text[] not null default '{}',
  status varchar(20) not null default 'open' check (status in ('open', 'investigating', 'resolved', 'closed')),
  resolution text,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index disputes_status_idx on public.disputes(status) where status in ('open', 'investigating');
create index disputes_order_idx on public.disputes(order_id);

create trigger disputes_updated_at
  before update on public.disputes
  for each row execute function public.update_updated_at();

-- Provider verification history
create table public.verification_history (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  action varchar(20) not null check (action in (
    'submitted', 'approved', 'rejected', 'request_info',
    'resubmitted', 'suspended', 'unsuspended'
  )),
  actor_id uuid not null references public.users(id),
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create index verification_history_provider_idx on public.verification_history(provider_id, created_at desc);

-- Admin action log (audit trail)
create table public.admin_action_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id),
  action_type varchar(30) not null check (action_type in (
    'refund', 'suspend_user', 'ban_user', 'unsuspend_user',
    'resolve_dispute', 'send_message', 'approve_provider',
    'reject_provider', 'hide_review'
  )),
  target_type varchar(20) not null check (target_type in ('order', 'user', 'provider', 'review', 'dispute')),
  target_id uuid not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index admin_action_log_admin_idx on public.admin_action_log(admin_id, created_at desc);
create index admin_action_log_target_idx on public.admin_action_log(target_type, target_id);
