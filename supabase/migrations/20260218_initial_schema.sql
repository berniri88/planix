-- Esquema de Base de Datos para Planix
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA DE VIAJES (TRIPS)
create table trips (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  image_url text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. VERSIONES DE ITINERARIO (Para comparar Opción A vs B)
create table itinerary_versions (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null default 'Plan Principal',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. ÍTEMS DEL ITINERARIO
create table itinerary_items (
  id uuid primary key default uuid_generate_v4(),
  version_id uuid references itinerary_versions(id) on delete cascade,
  type text not null check (type in ('Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea')),
  status text not null default 'Idea' check (status in ('Idea', 'Tentative', 'Confirmed')),
  title text not null,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  location jsonb, -- Almacena {address, lat, lng, name}
  cost decimal(12,2),
  currency text default 'USD',
  booking_reference text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. PARTICIPANTES (Colaboración)
create table participants (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'Viewer' check (role in ('Owner', 'Editor', 'Viewer')),
  joined_at timestamp with time zone default now(),
  unique(trip_id, user_id)
);

-- 6. DOCUMENTOS / TICKETS
create table documents (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references itinerary_items(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text,
  created_at timestamp with time zone default now()
);

-- 7. CHAT INTEGRADO
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- 8. POLÍTICAS DE SEGURIDAD (RLS)
alter table trips enable row level security;
alter table itinerary_versions enable row level security;
alter table itinerary_items enable row level security;
alter table participants enable row level security;
alter table documents enable row level security;
alter table chat_messages enable row level security;

-- Ejemplo de política: Solo los participantes pueden ver el viaje
create policy "Participants can view their trips" 
on trips for select 
using (
  exists (
    select 1 from participants 
    where participants.trip_id = trips.id 
    and participants.user_id = auth.uid()
  )
);

-- El owner tiene control total
create policy "Owners have full access" 
on trips for all 
using (owner_id = auth.uid());
