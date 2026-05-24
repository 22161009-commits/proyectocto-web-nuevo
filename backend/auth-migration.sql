-- Ejecutar como postgres: psql -d muebles_db -f backend/auth-migration.sql

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_google_id_key ON usuarios (google_id) WHERE google_id IS NOT NULL;

ALTER TABLE usuarios ALTER COLUMN contrasena DROP NOT NULL;

-- Rol publico: Usuario (id 3). Administrador y Editor solo se crean manualmente.
-- Opcional: quitar rol Editor si ya no se usa
-- DELETE FROM roles WHERE nombre_rol = 'Editor';
