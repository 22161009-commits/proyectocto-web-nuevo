import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'
import { scalePiezasFromModelo, buildMeasuresFromProyecto } from './piezas.js'
import { verifyGoogleCredential, getRolUsuarioId, mapUserResponse } from './auth.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json({ limit: '8mb' }))

function parseModeloMeta(row) {
  let meta = {}
  try {
    meta = row.descripcion ? JSON.parse(row.descripcion) : {}
  } catch {
    meta = {}
  }
  return {
    id_modelo: row.id_modelo,
    title: row.nombre_modelo,
    nombre_modelo: row.nombre_modelo,
    category: meta.categoria || 'General',
    image: meta.imagen || '/images/mesa.jpg',
    diagram: meta.diagrama || null,
    supportDiagram: meta.diagramaApoyo || null,
    base: meta.base || null,
    descripcion: row.descripcion,
  }
}

function normalizeCubrecanto(value) {
  const numericValue = Number(value)
  if (Number.isFinite(numericValue)) return numericValue > 0 ? 1 : 0
  return String(value || '').trim() ? 1 : 0
}

function formatDate(dateValue) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function mapProyectoToClient(row, piezas = []) {
  let meta = {}
  try {
    meta = row.modelo_descripcion ? JSON.parse(row.modelo_descripcion) : {}
  } catch {
    meta = {}
  }

  const measures = buildMeasuresFromProyecto(row)

  return {
    id: row.id_proyecto,
    id_proyecto: row.id_proyecto,
    id_modelo: row.id_modelo,
    name: row.nombre_proyecto,
    model: row.nombre_modelo,
    category: meta.categoria || 'General',
    image: meta.imagen || '/images/mesa.jpg',
    diagram: meta.diagrama || null,
    supportDiagram: meta.diagramaApoyo || null,
    measures,
    isFavorite: !!row.es_favorito,
    updatedAt: formatDate(row.fecha_creacion),
    piezas,
  }
}

function mapModeloPropioToClient(row) {
  return {
    id: `custom-${row.id_modelo_propio}`,
    id_proyecto: `custom-${row.id_modelo_propio}`,
    id_modelo_propio: row.id_modelo_propio,
    id_modelo: null,
    name: row.nombre_proyecto,
    model: 'Modelo personalizado',
    category: 'Personalizado',
    image: '/images/crear_nuev_diseño.jpeg',
    updatedAt: formatDate(row.fecha_actualizacion || row.fecha_creacion),
    isFavorite: !!row.es_favorito,
    measures: {
      custom: true,
      pieces: row.piezas_json || [],
      sidePieces: row.piezas_lado_json || [],
    },
  }
}

app.get('/api/health-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now')
    res.json({ ok: true, now: result.rows[0].now })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email y contrasena son obligatorios.' })
  }

  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.contrasena, u.id_rol,
              u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()],
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas.' })
    }

    if (!user.contrasena) {
      return res.status(401).json({
        ok: false,
        message: 'Esta cuenta usa Google. Inicia sesion con el boton de Google.',
      })
    }

    let isPasswordValid = false
    if (typeof user.contrasena === 'string' && user.contrasena.startsWith('$2')) {
      isPasswordValid = await bcrypt.compare(password, user.contrasena)
    } else {
      isPasswordValid = user.contrasena === password
    }

    if (!isPasswordValid) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas.' })
    }

    return res.json({ ok: true, user: mapUserResponse(user) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: 'Nombre, email y contrasena son obligatorios.' })
  }

  try {
    const idRolUsuario = await getRolUsuarioId(pool)

    const exists = await pool.query('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)', [
      email.trim(),
    ])
    if (exists.rowCount > 0) {
      return res.status(409).json({ ok: false, message: 'El email ya esta registrado.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const insert = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, id_rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, email, id_rol, perfil_info, sexo, correo_contacto, foto_url`,
      [nombre.trim(), email.trim().toLowerCase(), hashedPassword, idRolUsuario],
    )

    return res.status(201).json({ ok: true, user: mapUserResponse(insert.rows[0]) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    return res.status(400).json({ ok: false, message: 'Token de Google requerido.' })
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      ok: false,
      message: 'Google Sign-In no esta configurado en el servidor.',
    })
  }

  try {
    const googleUser = await verifyGoogleCredential(credential)
    const idRolUsuario = await getRolUsuarioId(pool)

    const byGoogle = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.id_rol,
              u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.google_id = $1`,
      [googleUser.googleId],
    )

    if (byGoogle.rowCount > 0) {
      return res.json({ ok: true, user: mapUserResponse(byGoogle.rows[0]) })
    }

    const byEmail = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.google_id, u.id_rol,
              u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       WHERE LOWER(u.email) = $1`,
      [googleUser.email],
    )

    if (byEmail.rowCount > 0) {
      const existing = byEmail.rows[0]
      const updated = await pool.query(
        `UPDATE usuarios
         SET google_id = $1, nombre = COALESCE(NULLIF(nombre, ''), $2)
         WHERE id_usuario = $3
         RETURNING id_usuario, nombre, email, id_rol, perfil_info, sexo, correo_contacto, foto_url`,
        [googleUser.googleId, googleUser.nombre, existing.id_usuario],
      )
      const withRole = await pool.query(
        `SELECT u.id_usuario, u.nombre, u.email, u.id_rol,
                u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
         FROM usuarios u
         LEFT JOIN roles r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = $1`,
        [updated.rows[0].id_usuario],
      )
      return res.json({ ok: true, user: mapUserResponse(withRole.rows[0]) })
    }

    const insert = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, id_rol, google_id)
       VALUES ($1, $2, NULL, $3, $4)
       RETURNING id_usuario, nombre, email, id_rol, perfil_info, sexo, correo_contacto, foto_url`,
      [googleUser.nombre, googleUser.email, idRolUsuario, googleUser.googleId],
    )

    const withRole = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.id_rol,
              u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1`,
      [insert.rows[0].id_usuario],
    )

    return res.status(201).json({ ok: true, user: mapUserResponse(withRole.rows[0]) })
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: error.message || 'No se pudo validar la cuenta de Google.',
    })
  }
})

// --- Perfil de usuario ---
app.get('/api/usuarios/:id/perfil', async (req, res) => {
  const idUsuario = Number(req.params.id)
  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: 'id_usuario invalido.' })
  }

  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.id_rol,
              u.perfil_info, u.sexo, u.correo_contacto, u.foto_url, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1`,
      [idUsuario],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' })
    }

    return res.json({ ok: true, user: mapUserResponse(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.put('/api/usuarios/:id/perfil', async (req, res) => {
  const idUsuario = Number(req.params.id)
  const { nombre, perfil_info = '', sexo = '', correo_contacto = '', foto_url = '' } = req.body

  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: 'id_usuario invalido.' })
  }

  if (!String(nombre || '').trim()) {
    return res.status(400).json({ ok: false, message: 'El nombre es obligatorio.' })
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = $1,
           perfil_info = $2,
           sexo = $3,
           correo_contacto = $4,
           foto_url = $5
       WHERE id_usuario = $6
       RETURNING id_usuario, nombre, email, id_rol, perfil_info, sexo, correo_contacto, foto_url`,
      [
        String(nombre).trim(),
        String(perfil_info || '').trim(),
        ['H', 'M'].includes(String(sexo || '').trim().toUpperCase())
          ? String(sexo).trim().toUpperCase()
          : '',
        String(correo_contacto || '').trim(),
        String(foto_url || '').trim(),
        idUsuario,
      ],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' })
    }

    return res.json({ ok: true, user: mapUserResponse(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

// --- Modelos (catalogo) ---
app.get('/api/modelos', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_modelo, nombre_modelo, descripcion FROM modelos
       ORDER BY CASE WHEN nombre_modelo = 'Zapatero' THEN 0 ELSE 1 END, id_modelo ASC`,
    )
    res.json({ ok: true, modelos: result.rows.map(parseModeloMeta) })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.get('/api/modelos/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const result = await pool.query(
      'SELECT id_modelo, nombre_modelo, descripcion FROM modelos WHERE id_modelo = $1',
      [id],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Modelo no encontrado.' })
    }

    const piezasModelo = await pool.query(
      `SELECT nombre_pieza, largo_base, ancho_base, cantidad, material, giro,
              canto_izq, canto_der, canto_sup, canto_inf
       FROM piezas_modelo WHERE id_modelo = $1 ORDER BY id_pieza_modelo`,
      [id],
    )

    res.json({
      ok: true,
      modelo: parseModeloMeta(result.rows[0]),
      piezasModelo: piezasModelo.rows.map((pieza) => ({
        ...pieza,
        canto_izq: normalizeCubrecanto(pieza.canto_izq),
        canto_der: normalizeCubrecanto(pieza.canto_der),
        canto_sup: normalizeCubrecanto(pieza.canto_sup),
        canto_inf: normalizeCubrecanto(pieza.canto_inf),
      })),
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

// --- Proyectos ---
app.get('/api/proyectos', async (req, res) => {
  const idUsuario = Number(req.query.id_usuario)
  if (!idUsuario) {
    return res.status(400).json({ ok: false, message: 'id_usuario es obligatorio.' })
  }

  try {
    const result = await pool.query(
      `SELECT p.id_proyecto, p.id_usuario, p.id_modelo, p.nombre_proyecto,
              p.alto, p.ancho, p.profundidad, p.fecha_creacion, p.es_favorito, p.medidas_extra,
              m.nombre_modelo, m.descripcion AS modelo_descripcion
       FROM proyectos p
       JOIN modelos m ON m.id_modelo = p.id_modelo
       WHERE p.id_usuario = $1
       ORDER BY p.fecha_creacion DESC`,
      [idUsuario],
    )

    res.json({
      ok: true,
      proyectos: [
        ...result.rows.map((row) => ({
          ...mapProyectoToClient(row),
          sortDate: row.fecha_creacion,
        })),
        ...(await pool.query(
          `SELECT id_modelo_propio, id_usuario, nombre_proyecto, piezas_json, piezas_lado_json,
                  es_favorito, fecha_creacion, fecha_actualizacion
           FROM modelos_propios
           WHERE id_usuario = $1`,
          [idUsuario],
        )).rows.map((row) => ({
          ...mapModeloPropioToClient(row),
          sortDate: row.fecha_actualizacion || row.fecha_creacion,
        })),
      ]
        .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
        .map(({ sortDate: _sortDate, ...project }) => project),
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.get('/api/proyectos/:id', async (req, res) => {
  const idProyecto = Number(req.params.id)
  try {
    const result = await pool.query(
      `SELECT p.id_proyecto, p.id_usuario, p.id_modelo, p.nombre_proyecto,
              p.alto, p.ancho, p.profundidad, p.fecha_creacion, p.es_favorito, p.medidas_extra,
              m.nombre_modelo, m.descripcion AS modelo_descripcion
       FROM proyectos p
       JOIN modelos m ON m.id_modelo = p.id_modelo
       WHERE p.id_proyecto = $1`,
      [idProyecto],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' })
    }

    const piezas = await pool.query(
      `SELECT id_pieza, nombre_pieza, largo, ancho, cantidad
       FROM piezas WHERE id_proyecto = $1 ORDER BY id_pieza`,
      [idProyecto],
    )

    res.json({
      ok: true,
      proyecto: mapProyectoToClient(result.rows[0], piezas.rows),
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/proyectos', async (req, res) => {
  const {
    id_usuario,
    id_modelo,
    nombre_proyecto,
    measures,
    es_favorito = false,
  } = req.body

  if (!id_usuario || !id_modelo || !nombre_proyecto || !measures) {
    return res.status(400).json({
      ok: false,
      message: 'id_usuario, id_modelo, nombre_proyecto y measures son obligatorios.',
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const modeloResult = await client.query(
      'SELECT id_modelo, nombre_modelo, descripcion FROM modelos WHERE id_modelo = $1',
      [id_modelo],
    )
    if (modeloResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ ok: false, message: 'Modelo no encontrado.' })
    }

    const modelo = parseModeloMeta(modeloResult.rows[0])
    const medidasExtra = {
      anchoSuperior: measures.anchoSuperior,
      altoLateral: measures.altoLateral,
      altoCajon: measures.altoCajon,
      anchoModulo: measures.anchoModulo,
      anchoCama: measures.anchoCama,
      fondoSuperior: measures.fondoSuperior,
      anchoFrontal: measures.anchoFrontal,
      anchoPuerta: measures.anchoPuerta,
      altoCajonera: measures.altoCajonera,
      altoPuertaChica: measures.altoPuertaChica,
      altoVertical: measures.altoVertical,
      anchoCajon: measures.anchoCajon,
      fondoModulo: measures.fondoModulo,
      altoDivisor: measures.altoDivisor,
      volado: measures.volado,
      fondoInterior: measures.fondoInterior,
      fondoCajon: measures.fondoCajon,
      anchoFaldon: measures.anchoFaldon,
      fondoTablero: measures.fondoTablero,
      altoZocalo: measures.altoZocalo,
      altoAmarre: measures.altoAmarre,
      altoFondo: measures.altoFondo,
      anchoFondo: measures.anchoFondo,
    }

    const proyectoInsert = await client.query(
      `INSERT INTO proyectos (id_usuario, id_modelo, nombre_proyecto, alto, ancho, profundidad, es_favorito, medidas_extra)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_proyecto, id_usuario, id_modelo, nombre_proyecto, alto, ancho, profundidad,
                 fecha_creacion, es_favorito, medidas_extra`,
      [
        id_usuario,
        id_modelo,
        nombre_proyecto.trim(),
        measures.altoTotal,
        measures.anchoTotal,
        measures.fondo,
        !!es_favorito,
        JSON.stringify(medidasExtra),
      ],
    )

    const proyectoRow = proyectoInsert.rows[0]
    const idProyecto = proyectoRow.id_proyecto

    let piezasInsertadas = []

    if (modelo.base) {
      const piezasModeloResult = await client.query(
        `SELECT nombre_pieza, largo_base, ancho_base, cantidad, material, giro,
                canto_izq, canto_der, canto_sup, canto_inf
         FROM piezas_modelo WHERE id_modelo = $1`,
        [id_modelo],
      )

      // Recalcula cada pieza segun medidas y guarda copia en tabla piezas (no en piezas_modelo)
      const piezasEscaladas = scalePiezasFromModelo(
        piezasModeloResult.rows,
        measures,
        modelo.base,
      )

      for (const pieza of piezasEscaladas) {
        const ins = await client.query(
          `INSERT INTO piezas (id_proyecto, nombre_pieza, largo, ancho, cantidad)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id_pieza, nombre_pieza, largo, ancho, cantidad`,
          [idProyecto, pieza.nombre_pieza, pieza.largo, pieza.ancho, pieza.cantidad],
        )
        piezasInsertadas.push(ins.rows[0])
      }
    }

    await client.query('COMMIT')

    const fullRow = {
      ...proyectoRow,
      nombre_modelo: modelo.nombre_modelo,
      modelo_descripcion: modeloResult.rows[0].descripcion,
    }

    res.status(201).json({
      ok: true,
      proyecto: mapProyectoToClient(fullRow, piezasInsertadas),
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ ok: false, message: error.message })
  } finally {
    client.release()
  }
})

app.put('/api/proyectos/:id', async (req, res) => {
  const idProyecto = Number(req.params.id)
  const { nombre_proyecto, measures, es_favorito, id_usuario } = req.body

  if (!nombre_proyecto || !measures || !id_usuario) {
    return res.status(400).json({ ok: false, message: 'Datos incompletos.' })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT id_proyecto, id_modelo FROM proyectos WHERE id_proyecto = $1 AND id_usuario = $2',
      [idProyecto, id_usuario],
    )
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' })
    }

    const idModelo = existing.rows[0].id_modelo

    const modeloResult = await client.query(
      'SELECT id_modelo, nombre_modelo, descripcion FROM modelos WHERE id_modelo = $1',
      [idModelo],
    )
    const modelo = parseModeloMeta(modeloResult.rows[0])

    const medidasExtra = {
      anchoSuperior: measures.anchoSuperior,
      altoLateral: measures.altoLateral,
      altoCajon: measures.altoCajon,
      anchoModulo: measures.anchoModulo,
      anchoCama: measures.anchoCama,
      fondoSuperior: measures.fondoSuperior,
      anchoFrontal: measures.anchoFrontal,
      anchoPuerta: measures.anchoPuerta,
      altoCajonera: measures.altoCajonera,
      altoPuertaChica: measures.altoPuertaChica,
      altoVertical: measures.altoVertical,
      anchoCajon: measures.anchoCajon,
      fondoModulo: measures.fondoModulo,
      altoDivisor: measures.altoDivisor,
      volado: measures.volado,
      fondoInterior: measures.fondoInterior,
      fondoCajon: measures.fondoCajon,
      anchoFaldon: measures.anchoFaldon,
      fondoTablero: measures.fondoTablero,
      altoZocalo: measures.altoZocalo,
      altoAmarre: measures.altoAmarre,
      altoFondo: measures.altoFondo,
      anchoFondo: measures.anchoFondo,
    }

    await client.query(
      `UPDATE proyectos
       SET nombre_proyecto = $1, alto = $2, ancho = $3, profundidad = $4,
           es_favorito = $5, medidas_extra = $6
       WHERE id_proyecto = $7`,
      [
        nombre_proyecto.trim(),
        measures.altoTotal,
        measures.anchoTotal,
        measures.fondo,
        !!es_favorito,
        JSON.stringify(medidasExtra),
        idProyecto,
      ],
    )

    await client.query('DELETE FROM piezas WHERE id_proyecto = $1', [idProyecto])

    let piezasInsertadas = []
    if (modelo.base) {
      const piezasModeloResult = await client.query(
        `SELECT nombre_pieza, largo_base, ancho_base, cantidad, material, giro,
                canto_izq, canto_der, canto_sup, canto_inf
         FROM piezas_modelo WHERE id_modelo = $1`,
        [idModelo],
      )

      const piezasEscaladas = scalePiezasFromModelo(
        piezasModeloResult.rows,
        measures,
        modelo.base,
      )

      for (const pieza of piezasEscaladas) {
        const ins = await client.query(
          `INSERT INTO piezas (id_proyecto, nombre_pieza, largo, ancho, cantidad)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id_pieza, nombre_pieza, largo, ancho, cantidad`,
          [idProyecto, pieza.nombre_pieza, pieza.largo, pieza.ancho, pieza.cantidad],
        )
        piezasInsertadas.push(ins.rows[0])
      }
    }

    await client.query('COMMIT')

    const updated = await pool.query(
      `SELECT p.id_proyecto, p.id_usuario, p.id_modelo, p.nombre_proyecto,
              p.alto, p.ancho, p.profundidad, p.fecha_creacion, p.es_favorito, p.medidas_extra,
              m.nombre_modelo, m.descripcion AS modelo_descripcion
       FROM proyectos p
       JOIN modelos m ON m.id_modelo = p.id_modelo
       WHERE p.id_proyecto = $1`,
      [idProyecto],
    )

    res.json({
      ok: true,
      proyecto: mapProyectoToClient(updated.rows[0], piezasInsertadas),
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ ok: false, message: error.message })
  } finally {
    client.release()
  }
})

app.post('/api/modelos-propios', async (req, res) => {
  const { id_usuario, nombre_proyecto, pieces = [], sidePieces = [], es_favorito = false } = req.body

  if (!id_usuario || !String(nombre_proyecto || '').trim()) {
    return res.status(400).json({
      ok: false,
      message: 'id_usuario y nombre_proyecto son obligatorios.',
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO modelos_propios
         (id_usuario, nombre_proyecto, piezas_json, piezas_lado_json, es_favorito)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_modelo_propio, id_usuario, nombre_proyecto, piezas_json, piezas_lado_json,
                 es_favorito, fecha_creacion, fecha_actualizacion`,
      [
        id_usuario,
        String(nombre_proyecto).trim(),
        JSON.stringify(pieces),
        JSON.stringify(sidePieces),
        !!es_favorito,
      ],
    )

    return res.status(201).json({ ok: true, proyecto: mapModeloPropioToClient(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.put('/api/modelos-propios/:id', async (req, res) => {
  const idModeloPropio = Number(req.params.id)
  const { id_usuario, nombre_proyecto, pieces = [], sidePieces = [], es_favorito = false } = req.body

  if (!idModeloPropio || !id_usuario || !String(nombre_proyecto || '').trim()) {
    return res.status(400).json({ ok: false, message: 'Datos incompletos.' })
  }

  try {
    const result = await pool.query(
      `UPDATE modelos_propios
       SET nombre_proyecto = $1,
           piezas_json = $2,
           piezas_lado_json = $3,
           es_favorito = $4,
           fecha_actualizacion = NOW()
       WHERE id_modelo_propio = $5 AND id_usuario = $6
       RETURNING id_modelo_propio, id_usuario, nombre_proyecto, piezas_json, piezas_lado_json,
                 es_favorito, fecha_creacion, fecha_actualizacion`,
      [
        String(nombre_proyecto).trim(),
        JSON.stringify(pieces),
        JSON.stringify(sidePieces),
        !!es_favorito,
        idModeloPropio,
        id_usuario,
      ],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Modelo propio no encontrado.' })
    }

    return res.json({ ok: true, proyecto: mapModeloPropioToClient(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.patch('/api/modelos-propios/:id/favorito', async (req, res) => {
  const idModeloPropio = Number(req.params.id)
  const { id_usuario, es_favorito } = req.body

  try {
    const result = await pool.query(
      `UPDATE modelos_propios
       SET es_favorito = $1, fecha_actualizacion = NOW()
       WHERE id_modelo_propio = $2 AND id_usuario = $3
       RETURNING es_favorito`,
      [!!es_favorito, idModeloPropio, id_usuario],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Modelo propio no encontrado.' })
    }

    return res.json({ ok: true, es_favorito: result.rows[0].es_favorito })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.delete('/api/modelos-propios/:id', async (req, res) => {
  const idModeloPropio = Number(req.params.id)
  const idUsuario = Number(req.query.id_usuario)

  try {
    const result = await pool.query(
      'DELETE FROM modelos_propios WHERE id_modelo_propio = $1 AND id_usuario = $2 RETURNING id_modelo_propio',
      [idModeloPropio, idUsuario],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Modelo propio no encontrado.' })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.patch('/api/proyectos/:id/favorito', async (req, res) => {
  const idProyecto = Number(req.params.id)
  const { id_usuario, es_favorito } = req.body

  try {
    const result = await pool.query(
      `UPDATE proyectos SET es_favorito = $1
       WHERE id_proyecto = $2 AND id_usuario = $3
       RETURNING id_proyecto, es_favorito`,
      [!!es_favorito, idProyecto, id_usuario],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' })
    }
    res.json({ ok: true, es_favorito: result.rows[0].es_favorito })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.delete('/api/proyectos/:id', async (req, res) => {
  const idProyecto = Number(req.params.id)
  const idUsuario = Number(req.query.id_usuario)

  try {
    const result = await pool.query(
      'DELETE FROM proyectos WHERE id_proyecto = $1 AND id_usuario = $2 RETURNING id_proyecto',
      [idProyecto, idUsuario],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Proyecto no encontrado.' })
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.use((error, _req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      ok: false,
      message: 'La imagen es demasiado grande. Usa una foto mas ligera.',
    })
  }
  return next(error)
})

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})
