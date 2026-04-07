-- Breed reference data
create table public.breeds (
  id serial primary key,
  species varchar(10) not null check (species in ('dog', 'cat', 'other')),
  name_vi varchar(100) not null,
  name_en varchar(100) not null,
  popularity_rank int
);

create index breeds_species_idx on public.breeds(species);

-- Pet profiles
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null,
  species varchar(10) not null check (species in ('dog', 'cat', 'other')),
  breed varchar(100),
  gender varchar(10) not null default 'unknown' check (gender in ('male', 'female', 'unknown')),
  date_of_birth date,
  weight_kg decimal(5,2),
  color varchar(50),
  photos text[] not null default '{}',
  vaccination_records jsonb not null default '[]',
  allergies text[] not null default '{}',
  chronic_conditions text[] not null default '{}',
  current_medications jsonb not null default '[]',
  is_neutered varchar(10) not null default 'unknown' check (is_neutered in ('yes', 'no', 'unknown')),
  temperament varchar(20) not null default 'normal' check (temperament in ('friendly', 'shy', 'aggressive', 'normal')),
  sociable_with_others varchar(10) not null default 'depends' check (sociable_with_others in ('yes', 'no', 'depends')),
  special_needs_notes text,
  emergency_vet_name varchar(200),
  emergency_vet_phone varchar(15),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_owner_idx on public.pets(owner_id);
create index pets_species_idx on public.pets(species);

create trigger pets_updated_at
  before update on public.pets
  for each row execute function public.update_updated_at();
