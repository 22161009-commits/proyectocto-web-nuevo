-- Ejecutar UNA VEZ como superusuario (postgres):
-- psql -d muebles_db -f backend/seed-admin.sql

ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS es_favorito BOOLEAN DEFAULT FALSE;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS medidas_extra JSONB;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE modelos TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE proyectos TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE piezas TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE piezas_modelo TO app_admin;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_admin;
