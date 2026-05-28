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

-- Modelo editable: Cabecera de cama
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Cabecera de cama',
  '{"categoria":"Recámara","imagen":"/images/cabecera_cama.jpeg","diagrama":"/images/diagrama_mueb/diagrama_cabecera_cama.jpeg","base":{"tipo":"cabecera_cama","anchoTotal":2450,"altoTotal":1150,"fondo":400,"anchoModulo":550,"anchoCama":1350,"anchoRespaldoHorizontal":1550,"altoCajonero":650,"fondoSuperior":420,"anchoFrontal":450,"altoCajon":150}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Cabecera de cama');

UPDATE modelos
SET descripcion = '{"categoria":"Recámara","imagen":"/images/cabecera_cama.jpeg","diagrama":"/images/diagrama_mueb/diagrama_cabecera_cama.jpeg","base":{"tipo":"cabecera_cama","anchoTotal":2450,"altoTotal":1150,"fondo":400,"anchoModulo":550,"anchoCama":1350,"anchoRespaldoHorizontal":1550,"altoCajonero":650,"fondoSuperior":420,"anchoFrontal":450,"altoCajon":150}}'
WHERE nombre_modelo = 'Cabecera de cama';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Cabecera de cama');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('RESPALDO VERTICAL', 1150, 550, 2, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('RESPALDO HORIZONTAL', 1550, 400, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('LATERAL DE CAJONERO', 632, 400, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('ZOCALOS', 414, 80, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('AMARRES', 414, 80, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('FRENTE DE CAJON INTERIOR', 352, 100, 4, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('LATERAL DE CAJON', 350, 100, 4, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('FRENTE DE CAJON', 444, 150, 2, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('FONDO DE CAJON', 366, 328, 2, 'MDF 3mm', 'N', 0, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Cabecera de cama';

-- Modelo editable: Closet 1
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Closet 1',
  '{"categoria":"Recámara","imagen":"/images/closet1.jpeg","diagrama":"/images/diagrama_mueb/diagrama_closet1.jpeg","diagramaApoyo":"/images/diagrama_mueb/diagrama2_closet1.jpeg","base":{"tipo":"closet1","anchoTotal":1300,"altoTotal":2100,"fondo":600,"altoCajonera":947,"anchoInterior":1264,"altoPuertas":1994,"altoPuertaChica":1153,"anchoPuerta":425,"altoVertical":1964,"anchoCajon":353,"altoCajon":173}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Closet 1');

UPDATE modelos
SET descripcion = '{"categoria":"Recámara","imagen":"/images/closet1.jpeg","diagrama":"/images/diagrama_mueb/diagrama_closet1.jpeg","diagramaApoyo":"/images/diagrama_mueb/diagrama2_closet1.jpeg","base":{"tipo":"closet1","anchoTotal":1300,"altoTotal":2100,"fondo":600,"altoCajonera":947,"anchoInterior":1264,"altoPuertas":1994,"altoPuertaChica":1153,"anchoPuerta":425,"altoVertical":1964,"anchoCajon":353,"altoCajon":173}}'
WHERE nombre_modelo = 'Closet 1';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Closet 1');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 2100, 580, 2, 'Melamina 18mm', 'N', 1, 0, 1, 0),
  ('BASE', 1264, 580, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('VERTICAL', 1964, 558, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISA', 831, 558, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISA 2', 415, 558, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('ZOCALO / AMARRES', 1264, 100, 5, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('LATERAL DE CAJON', 500, 173, 8, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('FRENTES DE CAJON', 353, 173, 8, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('TAPA DE CAJON', 201, 425, 4, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('PUERTAS', 1994, 425, 2, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('FONDO DE CAJON', 478, 367, 4, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('FONDO DE MUEBLE', 1978, 1278, 1, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('PUERTA CHICA', 1153, 425, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Closet 1';

-- Modelo editable: Mueble de TV
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Mueble de TV',
  '{"categoria":"Sala","imagen":"/images/mueble_de_tv.jpeg","diagrama":"/images/diagrama_mueb/diagrama_mueble_tv.jpeg","base":{"tipo":"mueble_tv","anchoTotal":1300,"altoTotal":1200,"fondo":280,"anchoCubierta":1200,"altoModulo":350,"anchoLateral":300,"anchoCajon":600,"altoCajon":280,"fondoModulo":280,"altoDivisor":150}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Mueble de TV');

UPDATE modelos
SET descripcion = '{"categoria":"Sala","imagen":"/images/mueble_de_tv.jpeg","diagrama":"/images/diagrama_mueb/diagrama_mueble_tv.jpeg","base":{"tipo":"mueble_tv","anchoTotal":1300,"altoTotal":1200,"fondo":280,"anchoCubierta":1200,"altoModulo":350,"anchoLateral":300,"anchoCajon":600,"altoCajon":280,"fondoModulo":280,"altoDivisor":150}}'
WHERE nombre_modelo = 'Mueble de TV';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Mueble de TV');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('PANEL RESPALDO TV', 1300, 1200, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('CUBIERTA / REPISA SUPERIOR', 1200, 280, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('LATERAL MODULO', 350, 280, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('LATERAL DE CAJON', 280, 280, 2, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('BASE / TAPA DE CAJON', 600, 280, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('DIVISOR CENTRAL', 150, 280, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISA LATERAL', 300, 280, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('SOPORTE VERTICAL TRASERO', 1200, 80, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('TAPA PERFIL TRASERO', 150, 80, 1, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('FRENTE DE CAJON', 600, 280, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Mueble de TV';

-- Modelo editable: Mesa de centro
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Mesa de centro',
  '{"categoria":"Sala","imagen":"/images/Mesa_centro.jpeg","diagrama":"/images/diagrama_mueb/diagrama_mesa_centro.jpeg","base":{"tipo":"mesa_centro","anchoTotal":800,"altoTotal":250,"fondo":600,"anchoSoporteIzq":455,"anchoSoporteDer":315,"volado":15,"altoModulo":150,"altoPata":100,"anchoCajon":600}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Mesa de centro');

UPDATE modelos
SET descripcion = '{"categoria":"Sala","imagen":"/images/Mesa_centro.jpeg","diagrama":"/images/diagrama_mueb/diagrama_mesa_centro.jpeg","base":{"tipo":"mesa_centro","anchoTotal":800,"altoTotal":250,"fondo":600,"anchoSoporteIzq":455,"anchoSoporteDer":315,"volado":15,"altoModulo":150,"altoPata":100,"anchoCajon":600}}'
WHERE nombre_modelo = 'Mesa de centro';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Mesa de centro');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('PISO / CUBIERTA', 800, 600, 2, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('SOPORTE LARGO', 800, 100, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('SOPORTE CORTO', 440, 100, 1, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('LATERAL', 285, 120, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('LATERAL CAJON', 250, 100, 2, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('TESTERO', 544, 100, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('PISO DE CAJON', 514, 250, 1, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('FRENTE DE CAJON', 600, 120, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('CORREDERA DE EXTENSION', 250, 0, 1, 'Herraje', 'N', 0, 0, 0, 0),
  ('PATAS', 100, 0, 4, 'Herraje', 'N', 0, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Mesa de centro';

-- Modelo editable: Librero con gavetas
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Librero con gavetas',
  '{"categoria":"Oficina","imagen":"/images/librero_gabetas.jpeg","diagrama":"/images/diagrama_mueb/diagrama_librero.jpeg","base":{"tipo":"librero_gavetas","anchoTotal":650,"altoTotal":2000,"fondo":450,"altoLateral":1964,"altoCajonera":500,"altoCajon":200,"anchoCajon":552,"anchoRepisa":614,"fondoInterior":428,"fondoCajon":400}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Librero con gavetas');

UPDATE modelos
SET descripcion = '{"categoria":"Oficina","imagen":"/images/librero_gabetas.jpeg","diagrama":"/images/diagrama_mueb/diagrama_librero.jpeg","base":{"tipo":"librero_gavetas","anchoTotal":650,"altoTotal":2000,"fondo":450,"altoLateral":1964,"altoCajonera":500,"altoCajon":200,"anchoCajon":552,"anchoRepisa":614,"fondoInterior":428,"fondoCajon":400}}'
WHERE nombre_modelo = 'Librero con gavetas';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Librero con gavetas');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 1964, 450, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('BASE / TECHO', 650, 450, 2, 'Melamina 18mm', 'N', 1, 0, 1, 1),
  ('REPISAS', 614, 428, 3, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('LATERAL DE CAJON', 400, 200, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('FRENTE DE CAJON', 552, 200, 4, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('TAPA DE CAJON', 644, 241, 2, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('FONDO DE CAJON', 378, 566, 2, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('FONDO DE MUEBLE', 1978, 628, 1, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('AMARRES', 614, 100, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Librero con gavetas';

-- Modelo editable: Escritorio 1
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Escritorio 1',
  '{"categoria":"Oficina","imagen":"/images/escritori1.jpeg","diagrama":"/images/diagrama_mueb/diagrama_escritorio1.jpeg","base":{"tipo":"escritorio1","anchoTotal":1000,"altoTotal":762,"fondo":470,"altoPatas":762,"anchoRepisa":364,"anchoFaldon":582,"fondoTablero":470,"altoZocalo":100,"altoAmarre":70}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Escritorio 1');

UPDATE modelos
SET descripcion = '{"categoria":"Oficina","imagen":"/images/escritori1.jpeg","diagrama":"/images/diagrama_mueb/diagrama_escritorio1.jpeg","base":{"tipo":"escritorio1","anchoTotal":1000,"altoTotal":762,"fondo":470,"altoPatas":762,"anchoRepisa":364,"anchoFaldon":582,"fondoTablero":470,"altoZocalo":100,"altoAmarre":70}}'
WHERE nombre_modelo = 'Escritorio 1';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Escritorio 1');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('PATAS', 762, 450, 3, 'Melamina 18mm', 'N', 1, 0, 1, 0),
  ('REPISAS', 364, 450, 2, 'Melamina 18mm', 'N', 1, 1, 0, 0),
  ('FALDON', 582, 400, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('ZOCALO', 364, 100, 2, 'Melamina 18mm', 'N', 0, 0, 0, 0),
  ('AMARRES', 364, 70, 3, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('AMARRES 2', 582, 70, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('TABLERO', 1000, 470, 1, 'Melamina 18mm', 'N', 1, 1, 1, 1)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Escritorio 1';

-- Modelo editable: Espejo de baño
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Espejo de bano',
  '{"categoria":"Baño","imagen":"/images/espejo_baño.jpeg","diagrama":"/images/diagrama_mueb/diagrama_espjo_baño.jpeg","base":{"tipo":"espejo_bano","anchoTotal":450,"altoTotal":600,"fondo":150,"anchoInterior":414,"fondoInterior":128,"altoFondo":578,"anchoFondo":428}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Espejo de bano');

UPDATE modelos
SET descripcion = '{"categoria":"Baño","imagen":"/images/espejo_baño.jpeg","diagrama":"/images/diagrama_mueb/diagrama_espjo_baño.jpeg","base":{"tipo":"espejo_bano","anchoTotal":450,"altoTotal":600,"fondo":150,"anchoInterior":414,"fondoInterior":128,"altoFondo":578,"anchoFondo":428}}'
WHERE nombre_modelo = 'Espejo de bano';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Espejo de bano');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 600, 150, 2, 'Melamina 18mm', 'N', 1, 0, 1, 1),
  ('BASE Y TECHO', 414, 150, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISAS', 414, 128, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('AMARRE 2', 414, 100, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('PUERTA', 600, 450, 1, 'Melamina 18mm + espejo', 'N', 1, 1, 1, 1),
  ('FONDO DE MUEBLES', 578, 428, 1, 'MDF 3mm', 'N', 0, 0, 0, 0)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Espejo de bano';

-- Modelo editable: Alacena de cocina
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Alacena de cocina',
  '{"categoria":"Cocina","imagen":"/images/alacena_cocina.jpeg","diagrama":"/images/diagrama_mueb/diagrama_alacena.jpeg","base":{"tipo":"alacena_cocina","anchoTotal":1250,"altoTotal":600,"fondo":300,"anchoInterior":1214,"altoLateral":600,"anchoModuloGrande":798,"anchoPuerta":594,"altoPuerta":408,"fondoInterior":278,"altoFondo":578,"anchoFondo":1228}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Alacena de cocina');

UPDATE modelos
SET descripcion = '{"categoria":"Cocina","imagen":"/images/alacena_cocina.jpeg","diagrama":"/images/diagrama_mueb/diagrama_alacena.jpeg","base":{"tipo":"alacena_cocina","anchoTotal":1250,"altoTotal":600,"fondo":300,"anchoInterior":1214,"altoLateral":600,"anchoModuloGrande":798,"anchoPuerta":594,"altoPuerta":408,"fondoInterior":278,"altoFondo":578,"anchoFondo":1228}}'
WHERE nombre_modelo = 'Alacena de cocina';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Alacena de cocina');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 600, 300, 2, 'Melamina 18mm', 'N', 1, 0, 1, 1),
  ('BASE Y TECHO', 1214, 300, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('VERTICAL', 564, 278, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISA 1', 798, 278, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('REPISA 2', 398, 278, 1, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('AMARRE', 1214, 100, 2, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('FONDO MUEBLE', 1228, 578, 1, 'MDF 3mm', 'N', 0, 0, 0, 0),
  ('PUERTA', 594, 408, 3, 'Melamina 18mm', 'N', 1, 1, 1, 1)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Alacena de cocina';

-- Modelo editable: Estante de sala
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT
  'Estante de sala',
  '{"categoria":"Sala","imagen":"/images/estante.jpeg","diagrama":"/images/diagrama_mueb/diagrama_estante.jpeg","base":{"tipo":"estante_sala","anchoTotal":900,"altoTotal":1040,"fondo":280,"altoLateral":260,"anchoRepisa":864,"altoFondo":1400,"anchoFondo":300}}',
  1
WHERE NOT EXISTS (SELECT 1 FROM modelos WHERE nombre_modelo = 'Estante de sala');

UPDATE modelos
SET descripcion = '{"categoria":"Sala","imagen":"/images/estante.jpeg","diagrama":"/images/diagrama_mueb/diagrama_estante.jpeg","base":{"tipo":"estante_sala","anchoTotal":900,"altoTotal":1040,"fondo":280,"altoLateral":260,"anchoRepisa":864,"altoFondo":1400,"anchoFondo":300}}'
WHERE nombre_modelo = 'Estante de sala';

DELETE FROM piezas_modelo
WHERE id_modelo = (SELECT id_modelo FROM modelos WHERE nombre_modelo = 'Estante de sala');

INSERT INTO piezas_modelo (id_modelo, nombre_pieza, largo_base, ancho_base, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
SELECT m.id_modelo, v.nombre, v.largo, v.ancho, v.cantidad, v.material, v.giro, v.canto_izq, v.canto_der, v.canto_sup, v.canto_inf
FROM modelos m
CROSS JOIN (VALUES
  ('LATERAL', 260, 280, 5, 'Melamina 18mm', 'N', 1, 1, 1, 1),
  ('BASE O REPISA', 864, 280, 6, 'Melamina 18mm', 'N', 1, 0, 0, 0),
  ('FONDO', 1400, 300, 1, 'MDF 3mm', 'N', 1, 1, 1, 1)
) AS v(nombre, largo, ancho, cantidad, material, giro, canto_izq, canto_der, canto_sup, canto_inf)
WHERE m.nombre_modelo = 'Estante de sala';

-- Otros modelos de catalogo (sin diagrama editable por ahora)
INSERT INTO modelos (nombre_modelo, descripcion, creado_por)
SELECT v.nombre, v.meta, 1
FROM (VALUES
  ('Especiero de cocina', '{"categoria":"Cocina","imagen":"/images/especiero_cocina.jpeg"}'),
  ('Isla de cocina', '{"categoria":"Cocina","imagen":"/images/isla_cosina.jpeg"}')
) AS v(nombre, meta)
WHERE NOT EXISTS (SELECT 1 FROM modelos m WHERE m.nombre_modelo = v.nombre);

DELETE FROM piezas_modelo
WHERE id_modelo IN (
  SELECT id_modelo FROM modelos
  WHERE nombre_modelo IN ('Mesa de trabajo', 'Cama individual', 'Sofa modular')
);
DELETE FROM modelos
WHERE nombre_modelo IN ('Mesa de trabajo', 'Cama individual', 'Sofa modular');

UPDATE piezas_modelo
SET
  canto_izq = CASE WHEN canto_izq > 0 THEN 1 ELSE 0 END,
  canto_der = CASE WHEN canto_der > 0 THEN 1 ELSE 0 END,
  canto_sup = CASE WHEN canto_sup > 0 THEN 1 ELSE 0 END,
  canto_inf = CASE WHEN canto_inf > 0 THEN 1 ELSE 0 END;
