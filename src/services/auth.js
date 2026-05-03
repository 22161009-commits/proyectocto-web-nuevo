import { API_BASE_URL } from '../config.js'

export async function fetchRolesList() {
  try {
    const response = await fetch(`${API_BASE_URL}/roles`)
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.roles ?? []
  } catch {
    return []
  }
}

export async function postLogin({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    throw new Error('Credenciales invalidas')
  }
  return response.json()
}

export async function postRegister({ nombre, email, password, id_rol }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre,
      email,
      password,
      id_rol,
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'No se pudo registrar la cuenta')
  }
  return data
}
