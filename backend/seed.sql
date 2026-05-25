-- Ejecutar en psql conectado a muebles_db como superusuario o dueño de tablas
-- psql -d muebles_db -f backend/seed.sql

-- Columnas extra: ejecutar seed-admin.sql como postgres si faltan
-- (app_admin no puede ALTER TABLE proyectos)

-- Plantillas de piezas por modelo (despiece base antes de escalar)
CREATE TABLE IF NOT EXISTS piezas_modelo (
  id_pieza_modelo SERIAL PRIMARY KEY,
  id_modelo INT NOT NULL REFERENCES modelos(id_modelo) ON DELETE CASCADE,
  nombre_pieza VARCHAR(100) NOT NULL,
  largo_base FLOAT NOT NULL,
  ancho_base FLOAT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  material VARCHAR(50) DEFAULT 'MDF 15mm',
  giro CHAR(1) DEFAULT 'N',
  canto_izq INT DEFAULT 0,
  canto_der INT DEFAULT 0,
  canto_sup INT DEFAULT 0,
  canto_inf INT DEFAULT 0
);

-- Permisos para app_admin
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE modelos TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE proyectos TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE piezas TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE piezas_modelo TO app_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE modelos_id_modelo_seq TO app_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE proyectos_id_proyecto_seq TO app_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE piezas_id_pieza_seq TO app_admin;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE piezas_modelo_id_pieza_modelo_seq TO app_admin;

-- Modelo Zapatero (metadata en descripcion como JSON)
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Zapatero',
  '{"categoria":"Organizacion","imagen":"/images/zapatero.jpeg","diagrama":"/images/diagrama_mueb/digrama_zap.jpeg","base":{"anchoTotal":480,"altoTotal":1200,"fondo":350,"anchoSuperior":450,"altoLateral":150}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Zapatero');

UPDATE modelos
SET descripcion = '{"categoria":"Organizacion","imagen":"/images/zapatero.jpeg","diagrama":"/images/diagrama_mueb/digrama_zap.jpeg","base":{"anchoTotal":480,"altoTotal":1200,"fondo":350,"anchoSuperior":450,"altoLateral":150}}'
WHERE nombre_modelo = 'Zapatero'
  AND (descripcion IS NULL OR descripcion NOT LIKE '{%');

-- Piezas base del Zapatero (solo si no existen)
INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('COLUMNA', 1032, 250, 1, 'MDF 15mm', 'N', 1, 1, 0, 0),
  ('VERTICAL', 1032, 250, 1, 'MDF 15mm', 'N', 1, 0, 0, 0),
  ('BASE', 480, 350, 1, 'MDF 15mm', 'N', 1, 1, 1, 1),
  ('REPISA', 260, 350, 12, 'MDF 15mm', 'N', 1, 1, 1, 1),
  ('LATERAL', 114, 350, 2, 'MDF 15mm', 'N', 1, 0, 0, 0),
  ('BASE Y TECHO', 450, 350, 2, 'MDF 15mm', 'N', 1, 1, 1, 1),
  ('LATERAL DE CAJON', 300, 80, 2, 'MDF 15mm', 'N', 1, 0, 0, 0),
  ('FRENTE DE CAJON', 352, 80, 2, 'MDF 15mm', 'N', 1, 0, 0, 0),
  ('TAPA DE CAJON', 104, 404, 1, 'MDF 15mm', 'N', 1, 1, 1, 1),
  ('FONDO DE CAJON', 278, 366, 1, 'MDF 3mm', 'N', 0, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Zapatero'
  AND NOT EXISTS (SELECT 1 FROM piezas_modelo pm WHERE pm.id_modelo = m.id_modelo);

-- Modelo editable: Buro de cajones
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Buro de cajones',
  '{"categoria":"Recámara","imagen":"/images/buro.jpeg","diagrama":"/images/diagrama_mueb/diagrama_buro.jpeg","base":{"tipo":"buro","anchoTotal":500,"altoTotal":650,"fondo":550,"anchoSuperior":500,"altoLateral":170,"altoCajon":100}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Buro de cajones');

UPDATE modelos
SET descripcion = '{"categoria":"Recámara","imagen":"/images/buro.jpeg","diagrama":"/images/diagrama_mueb/diagrama_buro.jpeg","base":{"tipo":"buro","anchoTotal":500,"altoTotal":650,"fondo":550,"anchoSuperior":500,"altoLateral":170,"altoCajon":100}}'
WHERE nombre_modelo = 'Buro de cajones';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Buro de cajones');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 532, 400, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('BASE / REPISA', 464, 400, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('TECHO', 400, 400, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('LATERAL DE CAJON', 350, 100, 2, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('FRENTE DE CAJON', 402, 100, 2, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('TAPA DE CAJON', 494, 164, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('FONDO DE CAJON', 416, 328, 1, 'MDF 3mm', 'N', 0, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Buro de cajones';

-- Otros modelos de catalogo (sin diagrama editable por ahora)
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT v.nombre, v.meta, 1
FROM (VALUES
  ('Mesa de trabajo', '{"categoria":"Mesa","imagen":"/images/mesa.jpg"}'),
  ('Cama individual', '{"categoria":"Dormitorio","imagen":"/images/cama_individual.jpeg"}'),
  ('Sofa modular', '{"categoria":"Sala","imagen":"/images/sofa.jpeg"}')
) AS v(nombre, meta)
WHERE NOT EXISTS (SELECT 1 FROM modelos m WHERE m.nombre_modelo = v.nombre);
