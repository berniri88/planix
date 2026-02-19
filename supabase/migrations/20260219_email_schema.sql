-- 1. TABLA DE PERFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- 2. TABLA DE BANDEJA DE ENTRADA (INBOX ITEMS)
create table public.inbox_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea')),
  status text default 'Pending' check (status in ('Pending', 'Accepted', 'Rejected')),
  title text not null,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  location jsonb,
  cost decimal(12,2),
  currency text default 'USD',
  booking_reference text,
  raw_content text, -- Para depuración, guarda el cuerpo del mail original
  created_at timestamp with time zone default now()
);

-- 3. RLS
alter table public.profiles enable row level security;
alter table public.inbox_items enable row level security;

-- Políticas Profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Políticas Inbox Items
create policy "Users can view their own inbox items" on public.inbox_items
  for select using (auth.uid() = user_id);

create policy "Users can delete their own inbox items" on public.inbox_items
  for delete using (auth.uid() = user_id);

create policy "Internal service can insert inbox items" on public.inbox_items
  for insert with check (true); -- Permitimos inserción para que la Edge Function pueda escribir (usará Service Role usualmente)

-- 4. TRIGGER PARA CREAR PERFIL AL REGISTRARSE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Poblar perfiles existentes si los hay
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
