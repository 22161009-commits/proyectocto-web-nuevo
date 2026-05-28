-- Ejecutar como postgres o dueno de las tablas:
-- psql -d muebles_db -f backend/custom-models-migration.sql

CREATE TABLE IF NOT EXISTS modelos_propios (
  id_modelo_propio SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nombre_proyecto VARCHAR(120) NOT NULL,
  piezas_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  piezas_lado_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  es_favorito BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE modelos_propios TO app_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE modelos_propios_id_modelo_propio_seq TO app_admin;
