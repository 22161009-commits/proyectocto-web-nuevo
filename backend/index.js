import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now')
    res.json({ ok: true, now: result.rows[0].now })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/roles', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_rol, nombre_rol FROM roles ORDER BY id_rol ASC',
    )
    res.json({ ok: true, roles: result.rows })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email y contrasena son obligatorios.' })
  }

  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre, email, contrasena, id_rol FROM usuarios WHERE email = $1',
      [email],
    )

    const user = result.rows[0]
    if (!user || user.contrasena !== password) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas.' })
    }

    return res.json({
      ok: true,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        id_rol: user.id_rol,
      },
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password, id_rol } = req.body

  if (!nombre || !email || !password || !id_rol) {
    return res
      .status(400)
      .json({ ok: false, message: 'Nombre, email, contrasena y rol son obligatorios.' })
  }

  try {
    const roleExists = await pool.query('SELECT 1 FROM roles WHERE id_rol = $1', [id_rol])
    if (roleExists.rowCount === 0) {
      return res.status(400).json({ ok: false, message: 'Rol invalido.' })
    }

    const exists = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email])
    if (exists.rowCount > 0) {
      return res.status(409).json({ ok: false, message: 'El email ya esta registrado.' })
    }

    const insert = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, id_rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, email, id_rol`,
      [nombre, email, password, id_rol],
    )

    return res.status(201).json({ ok: true, user: insert.rows[0] })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})
