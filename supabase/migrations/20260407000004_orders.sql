-- Cancellation reasons (reference data)
create table public.cancellation_reasons (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null unique,
  label_vi varchar(200) not null,
  label_en varchar(200),
  applicable_to varchar(10) not null check (applicable_to in ('owner', 'provider', 'both')),
  is_active boolean not null default true
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(20) not null unique,
  owner_id uuid not null references public.users(id),
  provider_id uuid not null references public.providers(id),
  room_type_id uuid not null references public.room_types(id),
  status varchar(20) not null default 'pending_payment' check (status in (
    'pending_payment', 'pending', 'confirmed', 'checked_in',
    'in_progress', 'check_out', 'completed', 'cancelled', 'disputed'
  )),
  check_in_date date not null,
  check_out_date date not null,
  num_nights int not null,
  pet_ids uuid[] not null,
  add_on_ids uuid[] not null default '{}',
  special_notes text,
  daily_status_report boolean not null default true,
  price_breakdown jsonb not null,
  total_price decimal(12,0) not null,
  cancellation_policy varchar(20) not null check (cancellation_policy in ('flexible', 'moderate', 'strict')),
  provider_response_deadline timestamptz,
  cancelled_at timestamptz,
  cancelled_by varchar(10) check (cancelled_by in ('owner', 'provider', 'system')),
  cancellation_reason text,
  refund_amount decimal(12,0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_dates check (check_out_date > check_in_date)
);

create index orders_owner_idx on public.orders(owner_id, created_at desc);
create index orders_provider_idx on public.orders(provider_id, created_at desc);
create index orders_status_idx on public.orders(status) where status not in ('completed', 'cancelled');
create index orders_number_idx on public.orders(order_number);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

-- Order number generation function
create or replace function public.generate_order_number()
returns trigger as $$
declare
  seq int;
begin
  seq := nextval('order_number_seq');
  new.order_number := 'PB-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create sequence if not exists order_number_seq start 1;

create trigger orders_generate_number
  before insert on public.orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute function public.generate_order_number();

-- Order status history
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status varchar(20) not null,
  actor_id uuid references public.users(id),
  actor_type varchar(10) not null check (actor_type in ('owner', 'provider', 'admin', 'system')),
  note text,
  created_at timestamptz not null default now()
);

create index order_history_order_idx on public.order_status_history(order_id, created_at);
