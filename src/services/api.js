const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Error en la solicitud')
  }
  return data
}

export async function fetchModelos() {
  const data = await request('/modelos')
  return data.modelos ?? []
}

export async function fetchProyectos(idUsuario) {
  const data = await request(`/proyectos?id_usuario=${idUsuario}`)
  return data.proyectos ?? []
}

export async function createProyecto(payload) {
  const data = await request('/proyectos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.proyecto
}

export async function updateProyecto(idProyecto, payload) {
  const data = await request(`/proyectos/${idProyecto}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.proyecto
}

export async function deleteProyecto(idProyecto, idUsuario) {
  await request(`/proyectos/${idProyecto}?id_usuario=${idUsuario}`, {
    method: 'DELETE',
  })
}

export async function createModeloPropio(payload) {
  const data = await request('/modelos-propios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.proyecto
}

export async function updateModeloPropio(idModeloPropio, payload) {
  const data = await request(`/modelos-propios/${idModeloPropio}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.proyecto
}

export async function deleteModeloPropio(idModeloPropio, idUsuario) {
  await request(`/modelos-propios/${idModeloPropio}?id_usuario=${idUsuario}`, {
    method: 'DELETE',
  })
}

export async function toggleModeloPropioFavorito(idModeloPropio, idUsuario, esFavorito) {
  const data = await request(`/modelos-propios/${idModeloPropio}/favorito`, {
    method: 'PATCH',
    body: JSON.stringify({ id_usuario: idUsuario, es_favorito: esFavorito }),
  })
  return data.es_favorito
}

export async function loginWithGoogle(credential) {
  const data = await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
  return data.user
}

export async function toggleFavoritoApi(idProyecto, idUsuario, esFavorito) {
  const data = await request(`/proyectos/${idProyecto}/favorito`, {
    method: 'PATCH',
    body: JSON.stringify({ id_usuario: idUsuario, es_favorito: esFavorito }),
  })
  return data.es_favorito
}

export async function fetchUserProfile(idUsuario) {
  const data = await request(`/usuarios/${idUsuario}/perfil`)
  return data.user
}

export async function updateUserProfile(idUsuario, payload) {
  const data = await request(`/usuarios/${idUsuario}/perfil`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return data.user
}
