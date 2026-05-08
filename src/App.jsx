import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = 'http://localhost:3001/api'

function App() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true',
  )
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
      try {
        const response = await fetch(`${API_BASE_URL}/roles`)
        if (!response.ok) {
          return
        }

        const data = await response.json()
        setRoles(data.roles ?? [])
      } catch {
        setRoles([])
      }
    }

    loadRoles()
  }, [])

  const catalogItems = useMemo(
    () => [
      { title: 'Mesa de trabajo', category: 'Mesa', image: '/images/mesa.jpg' },
      { title: 'Buro de cajones', category: 'Almacenamiento', image: '/images/buro.webp' },
      { title: 'Cama individual', category: 'Dormitorio', image: '/images/cama_individual.jpeg' },
      { title: 'Sofa modular', category: 'Sala', image: '/images/sofa.jpeg' },
    ],
    [],
  )
  const projectItems = useMemo(
    () => [
      { name: 'Closet recamara principal', model: 'Closet 2 puertas', updatedAt: '06 Mayo 2026' },
      { name: 'Centro de TV sala', model: 'Mueble TV moderno', updatedAt: '04 Mayo 2026' },
      { name: 'Escritorio estudio', model: 'Escritorio L', updatedAt: '01 Mayo 2026' },
    ],
    [],
  )

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        throw new Error('Credenciales invalidas')
      }

      const data = await response.json()
      localStorage.setItem('authToken', 'session-local')
      localStorage.setItem('userName', data.user?.nombre ?? '')
      localStorage.setItem('isLoggedIn', 'true')
      setIsLoggedIn(true)
      navigate('/inicio')
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: name,
          email,
          password,
          id_rol: Number(selectedRoleId),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar la cuenta')
      }

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

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
    setName('')
    setEmail('')
    setPassword('')
    navigate('/')
  }

  if (!isLoggedIn) {
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

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <p className="brand">elesquinero</p>
        <p className="menu-title">MENU</p>
        <NavLink className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} to="/inicio">
          Inicio
        </NavLink>
        <NavLink
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          to="/mis-proyectos"
        >
          Mis proyectos
        </NavLink>
        <NavLink
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          to="/favoritos"
        >
          Favoritos
        </NavLink>
        <p className="menu-title">OTROS</p>
        <NavLink
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          to="/configuracion"
        >
          Configuracion
        </NavLink>
        <NavLink className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} to="/ayuda">
          Ayuda
        </NavLink>
      </aside>

      <section className="content">
        <header className="topbar">
          <input className="search" type="text" placeholder="Buscar proyecto o modelo..." />
          <button className="logout" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </header>

        <Routes>
          <Route
            path="/inicio"
            element={<HomeView catalogItems={catalogItems} userName={localStorage.getItem('userName')} />}
          />
          <Route
            path="/mis-proyectos"
            element={
              <ProjectsView projectItems={projectItems} userName={localStorage.getItem('userName')} />
            }
          />
          <Route path="/favoritos" element={<FavoritesView />} />
          <Route path="/configuracion" element={<SettingsView />} />
          <Route path="/ayuda" element={<HelpView />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </section>
    </main>
  )
}

function HomeView({ catalogItems, userName }) {
  return (
    <>
      <section className="hero-banner">
        <div>
          <p className="section-label">Catalogo principal</p>
          <h2>Hola {userName || 'usuario'}, selecciona tu siguiente mueble</h2>
          <p>Visualiza modelos y entra directo a crear un proyecto.</p>
        </div>
        <img src="/images/pagiana_de_menu_principal.png" alt="Catalogo de muebles" />
      </section>

      <section className="catalog-grid">
        {catalogItems.map((item) => (
          <article className="card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <span>{item.category}</span>
            <h3>{item.title}</h3>
          </article>
        ))}
      </section>
    </>
  )
}

function ProjectsView({ projectItems, userName }) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Mis proyectos</h2>
        <p>Vista de proyectos creados por {userName || 'el usuario actual'}.</p>
      </div>
      <div className="projects-table">
        {projectItems.map((project) => (
          <article className="project-row" key={project.name}>
            <div>
              <h3>{project.name}</h3>
              <p>{project.model}</p>
            </div>
            <span>{project.updatedAt}</span>
            <button type="button">Ver detalle</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function FavoritesView() {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Favoritos</h2>
        <p>Guarda los modelos que usas seguido para acceder rapido.</p>
      </div>
      <div className="empty-state">
        <p>Aun no tienes favoritos. Desde Inicio puedes marcar modelos para verlos aqui.</p>
      </div>
    </section>
  )
}

function SettingsView() {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Configuracion</h2>
        <p>Ajustes basicos de la cuenta y de la experiencia en la plataforma.</p>
      </div>
      <div className="settings-grid">
        <article className="setting-card">
          <h3>Perfil</h3>
          <p>Editar nombre y email.</p>
          <button type="button">Editar perfil</button>
        </article>
        <article className="setting-card">
          <h3>Preferencias</h3>
          <p>Cambiar tema y formato de medidas.</p>
          <button type="button">Abrir preferencias</button>
        </article>
      </div>
    </section>
  )
}

function HelpView() {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Ayuda</h2>
        <p>Accesos rapidos para resolver dudas comunes.</p>
      </div>
      <ul className="help-list">
        <li>Como crear un proyecto nuevo.</li>
        <li>Como duplicar un modelo existente.</li>
        <li>Como exportar medidas para corte.</li>
      </ul>
    </section>
  )
}

export default App
