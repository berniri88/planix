-- 1. Crear el bucket 'planix-documents' si no existe
insert into storage.buckets (id, name, public)
values ('planix-documents', 'planix-documents', false)
on conflict (id) do nothing;

-- 2. Habilitar RLS en storage.objects (esto ya suele estar habilitado por defecto en Supabase)
-- alter table storage.objects enable row level security;

-- 3. POLÍTICAS PARA EL BUCKET 'planix-documents'

-- Limpiar políticas existentes para evitar errores de duplicado
drop policy if exists "Participants can view documents" on storage.objects;
drop policy if exists "Owners and editors can upload documents" on storage.objects;
drop policy if exists "Owners and editors can update documents" on storage.objects;
drop policy if exists "Owners and editors can delete documents" on storage.objects;

-- SELECT: Los participantes del viaje pueden ver los archivos
-- El path esperado es 'trips/{trip_id}/{item_id}/{filename}'
create policy "Participants can view documents"
on storage.objects for select
using (
  bucket_id = 'planix-documents' 
  and public.check_trip_membership((string_to_array(name, '/'))[2]::uuid, auth.uid())
);

-- INSERT: Dueños o editores pueden subir archivos
create policy "Owners and editors can upload documents"
on storage.objects for insert
with check (
  bucket_id = 'planix-documents'
  and (
    exists (
      select 1 from public.participants
      where trip_id = (string_to_array(name, '/'))[2]::uuid
      and user_id = auth.uid()
      and role in ('Owner', 'Editor')
    )
  )
);

-- UPDATE: Dueños o editores pueden actualizar archivos
create policy "Owners and editors can update documents"
on storage.objects for update
using (
  bucket_id = 'planix-documents'
  and (
    exists (
      select 1 from public.participants
      where trip_id = (string_to_array(name, '/'))[2]::uuid
      and user_id = auth.uid()
      and role in ('Owner', 'Editor')
    )
  )
);

-- DELETE: Dueños o editores pueden borrar archivos
create policy "Owners and editors can delete documents"
on storage.objects for delete
using (
  bucket_id = 'planix-documents'
  and (
    exists (
      select 1 from public.participants
      where trip_id = (string_to_array(name, '/'))[2]::uuid
      and user_id = auth.uid()
      and role in ('Owner', 'Editor')
    )
  )
);
