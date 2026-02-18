-- Políticas RLS adicionales para el MVP
-- Ejecutar en Supabase SQL Editor

-- === ITINERARY VERSIONS ===
create policy "Participants can view versions"
on itinerary_versions for select
using (
  exists (
    select 1 from participants
    where participants.trip_id = itinerary_versions.trip_id
    and participants.user_id = auth.uid()
  )
);

-- === ITINERARY ITEMS ===
create policy "Participants can view items"
on itinerary_items for select
using (
  exists (
    select 1 from participants p
    join itinerary_versions v on v.trip_id = p.trip_id
    where v.id = itinerary_items.version_id
    and p.user_id = auth.uid()
  )
);

create policy "Editors and owners can insert items"
on itinerary_items for insert
with check (
  exists (
    select 1 from participants p
    join itinerary_versions v on v.trip_id = p.trip_id
    where v.id = itinerary_items.version_id
    and p.user_id = auth.uid()
    and p.role in ('Owner', 'Editor')
  )
);

create policy "Editors and owners can update items"
on itinerary_items for update
using (
  exists (
    select 1 from participants p
    join itinerary_versions v on v.trip_id = p.trip_id
    where v.id = itinerary_items.version_id
    and p.user_id = auth.uid()
    and p.role in ('Owner', 'Editor')
  )
);

create policy "Editors and owners can delete items"
on itinerary_items for delete
using (
  exists (
    select 1 from participants p
    join itinerary_versions v on v.trip_id = p.trip_id
    where v.id = itinerary_items.version_id
    and p.user_id = auth.uid()
    and p.role in ('Owner', 'Editor')
  )
);

-- === PARTICIPANTS ===
create policy "Participants can view other participants"
on participants for select
using (
  exists (
    select 1 from participants p2
    where p2.trip_id = participants.trip_id
    and p2.user_id = auth.uid()
  )
);

-- === CHAT MESSAGES ===
create policy "Participants can view chat"
on chat_messages for select
using (
  exists (
    select 1 from participants
    where participants.trip_id = chat_messages.trip_id
    and participants.user_id = auth.uid()
  )
);

create policy "Participants can send messages"
on chat_messages for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from participants
    where participants.trip_id = chat_messages.trip_id
    and participants.user_id = auth.uid()
  )
);

-- === TRIPS: Insertar ===
create policy "Authenticated users can create trips"
on trips for insert
with check (auth.uid() = owner_id);

-- === TRIPS: Actualizar ===
create policy "Owners can update their trips"
on trips for update
using (owner_id = auth.uid());

-- === TRIPS: Eliminar ===
create policy "Owners can delete their trips"
on trips for delete
using (owner_id = auth.uid());

-- Habilitar Realtime para las tablas que lo necesitan
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table chat_messages;
