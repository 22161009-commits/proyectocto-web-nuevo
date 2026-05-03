import { useEffect, useState } from 'react'
import { fetchRolesList, postLogin, postRegister } from '../services/auth.js'
import './LoginScreen.css'

export default function LoginScreen({ onLoggedIn }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  useEffect(() => {
    const loadRoles = async () => {
      setRoles(await fetchRolesList())
    }
    loadRoles()
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const data = await postLogin({ email, password })
      localStorage.setItem('authToken', 'session-local')
      localStorage.setItem('userName', data.user?.nombre ?? '')
      localStorage.setItem('isLoggedIn', 'true')
      onLoggedIn()
    } catch {
      setError('No se pudo iniciar sesion. Verifica email y contrasena.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await postRegister({
        nombre: name,
        email,
        password,
        id_rol: Number(selectedRoleId),
      })
      setSuccess('Cuenta creada correctamente. Ahora puedes iniciar sesion.')
      setIsRegisterMode(false)
      setName('')
      setSelectedRoleId('')
      setPassword('')
    } catch (error) {
      setError(error.message || 'No se pudo registrar la cuenta. Intenta con otro usuario.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsRegisterMode((previousMode) => !previousMode)
    setError('')
    setSuccess('')
    setName('')
    setSelectedRoleId('')
    setPassword('')
  }

  return (
    <main className="login-screen">
      <section className="login-visual">
        <img src="/images/pagina_de_iniicio.png" alt="Vista de inicio del proyecto" />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="brand">elesquinero</p>
          <h1>{isRegisterMode ? 'Crear cuenta' : 'Iniciar sesion'}</h1>
          <p className="login-help">
            {isRegisterMode
              ? 'Registra un usuario para practicar validaciones con API.'
              : 'Ingresa para administrar tu catalogo de muebles.'}
          </p>

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="login-form">
            {isRegisterMode ? (
              <>
                <label htmlFor="name">Nombre</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </>
            ) : null}

            {isRegisterMode ? (
              <>
                <label htmlFor="role">Rol</label>
                <select
                  id="role"
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id_rol} value={role.id_rol}>
                      {role.nombre_rol}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@test.com"
              required
            />

            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="1234"
              required
            />

            {error ? <p className="login-error">{error}</p> : null}
            {success ? <p className="login-success">{success}</p> : null}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Procesando...' : isRegisterMode ? 'Registrar cuenta' : 'Entrar'}
            </button>
            <button type="button" className="secondary-btn" onClick={toggleAuthMode}>
              {isRegisterMode ? 'Ya tengo cuenta' : 'Registrar nueva cuenta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
