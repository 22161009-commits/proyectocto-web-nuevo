-- Ejecutar como postgres o dueno de la tabla:
-- psql -d muebles_db -f backend/profile-migration.sql

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_info TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pronombres VARCHAR(80) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(255) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sexo CHAR(1) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo_contacto VARCHAR(255) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT DEFAULT '';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios TO app_admin;
