-- Provider profiles
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  business_name varchar(200) not null,
  description text,
  license_number varchar(100),
  license_photos text[] not null default '{}',
  address varchar(500) not null,
  latitude decimal(10,8) not null,
  longitude decimal(11,8) not null,
  phone varchar(15),
  facility_photos text[] not null default '{}',
  certification_photos text[] not null default '{}',
  accepted_species text[] not null default '{dog,cat}',
  weight_limit_min_kg decimal(5,2),
  weight_limit_max_kg decimal(5,2),
  cancellation_policy varchar(20) not null default 'flexible' check (cancellation_policy in ('flexible', 'moderate', 'strict')),
  verification_status varchar(20) not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected', 'suspended')),
  verification_notes text,
  verified_at timestamptz,
  verified_by uuid references public.users(id),
  rating_average decimal(3,2) not null default 0.00,
  rating_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- GiST index for geo search
create extension if not exists postgis;
create index providers_geo_idx on public.providers using gist (
  st_makepoint(longitude, latitude)
);
create index providers_search_idx on public.providers(verification_status, is_active, rating_average desc);
create index providers_user_idx on public.providers(user_id);

create trigger providers_updated_at
  before update on public.providers
  for each row execute function public.update_updated_at();

-- Room types
create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name varchar(100) not null,
  description text,
  capacity int not null default 1,
  price_per_night decimal(12,0) not null check (price_per_night >= 50000 and price_per_night <= 10000000),
  photos text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index room_types_provider_idx on public.room_types(provider_id);

create trigger room_types_updated_at
  before update on public.room_types
  for each row execute function public.update_updated_at();

-- Add-on services
create table public.add_on_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name varchar(100) not null,
  description text,
  price decimal(12,0) not null check (price > 0),
  price_type varchar(20) not null check (price_type in ('per_night', 'per_booking', 'per_pet')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index add_on_services_provider_idx on public.add_on_services(provider_id);

create trigger add_on_services_updated_at
  before update on public.add_on_services
  for each row execute function public.update_updated_at();

-- Provider availability calendar
create table public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  room_type_id uuid not null references public.room_types(id) on delete cascade,
  date date not null,
  available_slots int not null default 0,
  booked_slots int not null default 0,
  is_blocked boolean not null default false,
  unique(room_type_id, date)
);

create index availability_provider_date_idx on public.provider_availability(provider_id, date);

-- Favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, provider_id)
);

create index favorites_user_idx on public.favorites(user_id);

-- Search history
create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  query_text varchar(500),
  latitude decimal(10,8),
  longitude decimal(11,8),
  filters jsonb,
  created_at timestamptz not null default now()
);

create index search_history_user_idx on public.search_history(user_id, created_at desc);

-- Listing change log (audit trail)
create table public.listing_change_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  changed_by uuid not null references public.users(id),
  field_name varchar(100) not null,
  old_value text,
  new_value text,
  requires_reverification boolean not null default false,
  created_at timestamptz not null default now()
);

create index listing_change_log_provider_idx on public.listing_change_log(provider_id, created_at desc);
