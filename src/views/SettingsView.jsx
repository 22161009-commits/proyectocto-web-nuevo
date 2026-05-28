import { useEffect, useState } from 'react'
import { fetchUserProfile, updateUserProfile } from '../services/api.js'

const emptyProfile = {
  nombre: '',
  email: '',
  correo_contacto: '',
  perfil_info: '',
  sexo: '',
  foto_url: '',
}

export default function SettingsView({
  userId,
  initialUserName = '',
  initialUserEmail = '',
  onProfileUpdated,
}) {
  const fallbackProfile = {
    ...emptyProfile,
    nombre: initialUserName,
    email: initialUserEmail,
    correo_contacto: initialUserEmail,
  }
  const [profile, setProfile] = useState(fallbackProfile)
  const [initialProfile, setInitialProfile] = useState(fallbackProfile)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const nextFallbackProfile = {
      ...emptyProfile,
      nombre: initialUserName,
      email: initialUserEmail,
      correo_contacto: initialUserEmail,
    }
    setProfile((previous) => ({
      ...nextFallbackProfile,
      ...previous,
      nombre: previous.nombre || nextFallbackProfile.nombre,
      email: previous.email || nextFallbackProfile.email,
      correo_contacto: previous.correo_contacto || nextFallbackProfile.correo_contacto,
    }))
    setInitialProfile((previous) => ({
      ...nextFallbackProfile,
      ...previous,
      nombre: previous.nombre || nextFallbackProfile.nombre,
      email: previous.email || nextFallbackProfile.email,
      correo_contacto: previous.correo_contacto || nextFallbackProfile.correo_contacto,
    }))

    if (!userId) return undefined

    let ignore = false
    setIsLoading(true)
    setError('')

    fetchUserProfile(userId)
      .then((user) => {
        if (ignore) return
        const nextProfile = {
          ...nextFallbackProfile,
          ...user,
          nombre: user.nombre || nextFallbackProfile.nombre,
          email: user.email || nextFallbackProfile.email,
          correo_contacto:
            user.correo_contacto || user.email || nextFallbackProfile.correo_contacto,
        }
        setProfile(nextProfile)
        setInitialProfile(nextProfile)
      })
      .catch((profileError) => {
        if (!ignore) setError(profileError.message || 'No se pudo cargar el perfil.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [userId, initialUserName, initialUserEmail])

  const updateField = (field, value) => {
    setProfile((previous) => ({ ...previous, [field]: value }))
    setMessage('')
    setError('')
  }

  const resetProfile = () => {
    setProfile(initialProfile)
    setMessage('')
    setError('')
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen valida.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      updateField('foto_url', reader.result || '')
    }
    reader.onerror = () => setError('No se pudo cargar la imagen.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!profile.nombre.trim()) {
      setError('El nombre no puede quedar vacio.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const updated = await updateUserProfile(userId, {
        nombre: profile.nombre,
        perfil_info: profile.perfil_info,
        sexo: profile.sexo,
        correo_contacto: profile.correo_contacto,
        foto_url: profile.foto_url,
      })
      const nextProfile = { ...emptyProfile, ...updated }
      setProfile(nextProfile)
      setInitialProfile(nextProfile)
      onProfileUpdated?.(updated)
      setMessage('Perfil actualizado correctamente.')
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="content-view profile-settings-view">
      <div className="page-header">
        <h2>Editar perfil</h2>
        <p>
          Manten la privacidad de tus datos personales. La informacion que agregues aqui se
          guarda en tu cuenta.
        </p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-photo-row">
          <div>
            <span className="profile-field-label">Foto</span>
            <div className="profile-avatar">
              {profile.foto_url ? (
                <img src={profile.foto_url} alt="Foto de perfil" />
              ) : (
                <span>{profile.nombre.trim().charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>
          <label className="profile-photo-input">
            Foto de perfil
            <input
              type="file"
              accept="image/*"
              disabled={isLoading}
              onChange={handlePhotoChange}
            />
          </label>
        </div>

        <label className="profile-field">
          <span>Nombre</span>
          <input
            type="text"
            value={profile.nombre}
            maxLength={100}
            disabled={isLoading}
            onChange={(event) => updateField('nombre', event.target.value)}
          />
        </label>

        <label className="profile-field">
          <span>Info</span>
          <textarea
            value={profile.perfil_info}
            maxLength={500}
            placeholder="Cuenta tu historia"
            disabled={isLoading}
            onChange={(event) => updateField('perfil_info', event.target.value)}
          />
        </label>

        <label className="profile-field">
          <span>Sexo</span>
          <select
            value={profile.sexo}
            disabled={isLoading}
            onChange={(event) => updateField('sexo', event.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="H">H</option>
            <option value="M">M</option>
          </select>
        </label>

        <label className="profile-field">
          <span>Correo de contacto</span>
          <input
            type="email"
            value={profile.correo_contacto}
            placeholder="correo@ejemplo.com"
            disabled={isLoading}
            onChange={(event) => updateField('correo_contacto', event.target.value)}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}

        <div className="profile-actions">
          <button type="button" onClick={resetProfile} disabled={isLoading || isSaving}>
            Restablecer
          </button>
          <button type="submit" disabled={isLoading || isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </section>
  )
}
