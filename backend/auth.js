import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function verifyGoogleCredential(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload?.email) {
    throw new Error('No se pudo obtener el email de Google.')
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    nombre: payload.name || payload.email.split('@')[0],
    picture: payload.picture || null,
  }
}

export async function getRolUsuarioId(pool) {
  const result = await pool.query(
    `SELECT id_rol FROM roles
     WHERE LOWER(nombre_rol) IN ('usuario', 'cliente')
     ORDER BY id_rol ASC
     LIMIT 1`,
  )
  if (result.rowCount > 0) return result.rows[0].id_rol

  const fallback = await pool.query('SELECT id_rol FROM roles ORDER BY id_rol DESC LIMIT 1')
  return fallback.rows[0]?.id_rol ?? 3
}

export function mapUserResponse(row) {
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre,
    email: row.email,
    id_rol: row.id_rol,
    nombre_rol: row.nombre_rol ?? null,
  }
}
