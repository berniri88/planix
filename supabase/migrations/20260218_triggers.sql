-- triggers para automatizar la creación de la primera versión y el participante owner
-- Ejecutar en Supabase SQL Editor

-- Función para manejar la creación automática de versión y participante
create or replace function public.handle_new_trip()
returns trigger as $$
begin
  -- 1. Crear la primera versión del itinerario
  insert into public.itinerary_versions (trip_id, name, is_active)
  values (new.id, 'Plan Principal', true);

  -- 2. Crear el registro de participante para el owner
  insert into public.participants (trip_id, user_id, role)
  values (new.id, new.owner_id, 'Owner');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger que se dispara después de insertar un viaje
create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();
