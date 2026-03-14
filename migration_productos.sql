-- Script SQL para actualizar la tabla productos con los nuevos campos
-- Ejecutar esto en el SQL Editor de Supabase

-- Agregar nuevos campos a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS tipo_flor VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_inicio_oferta TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_fin_oferta TIMESTAMP;

-- Verificar que los campos existan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
