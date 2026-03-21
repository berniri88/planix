-- Añadir soporte para Airbnb y otros tipos de transporte
-- Añadir campo para URL de reserva

-- 1. Actualizar restricciones de tipo en itinerary_items
ALTER TABLE public.itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_type_check;
ALTER TABLE public.itinerary_items ADD CONSTRAINT itinerary_items_type_check 
  CHECK (type IN ('Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea', 'Airbnb', 'Bus', 'Train', 'Taxi'));

-- 2. Actualizar restricciones de tipo en inbox_items
ALTER TABLE public.inbox_items DROP CONSTRAINT IF EXISTS inbox_items_type_check;
ALTER TABLE public.inbox_items ADD CONSTRAINT inbox_items_type_check 
  CHECK (type IN ('Flight', 'Hotel', 'Activity', 'Restaurant', 'Transport', 'Idea', 'Airbnb', 'Bus', 'Train', 'Taxi'));

-- 3. Añadir columna booking_url
ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- Comentario para documentación
COMMENT ON COLUMN public.itinerary_items.booking_url IS 'URL directa a la reserva (ej: Airbnb, Booking.com)';
