import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = 'http://localhost:3001/api'
const PROJECTS_STORAGE_KEY = 'projects-local'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [selectedModel, setSelectedModel] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectMessage, setProjectMessage] = useState('')

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

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const catalogItems = useMemo(
    () => [
      { title: 'Mesa de trabajo', category: 'Mesa', image: '/images/mesa.jpg' },
      { title: 'Buro de cajones', category: 'Almacenamiento', image: '/images/buro.webp' },
      { title: 'Cama individual', category: 'Dormitorio', image: '/images/cama_individual.jpeg' },
      { title: 'Sofa modular', category: 'Sala', image: '/images/sofa.jpeg' },
    ],
    [],
  )

  const filteredProjects = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) return projects
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalizedTerm) ||
        project.model.toLowerCase().includes(normalizedTerm)
      )
    })
  }, [projects, searchTerm])

  const favoriteProjects = useMemo(
    () => filteredProjects.filter((project) => project.isFavorite),
    [filteredProjects],
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
      setError('')
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
    setSearchTerm('')
    setSelectedModel(null)
    setProjectName('')
    setProjectMessage('')
    navigate('/')
  }

  const handleChooseModel = (model) => {
    setSelectedModel(model)
    setProjectName(`${model.title} ${new Date().getFullYear()}`)
    setProjectMessage('')
  }

  const handleCreateProject = (event) => {
    event.preventDefault()
    if (!selectedModel || !projectName.trim()) return

    const newProject = {
      id: Date.now(),
      name: projectName.trim(),
      model: selectedModel.title,
      category: selectedModel.category,
      image: selectedModel.image,
      updatedAt: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      isFavorite: false,
    }

    setProjects((previousProjects) => [newProject, ...previousProjects])
    setProjectMessage('Proyecto creado correctamente y agregado a Mis proyectos.')
    setSelectedModel(null)
    setProjectName('')
    navigate('/mis-proyectos')
  }

  const toggleFavoriteProject = (projectId) => {
    setProjects((previousProjects) =>
      previousProjects.map((project) =>
        project.id === projectId ? { ...project, isFavorite: !project.isFavorite } : project,
      ),
    )
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
          <input
            className="search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar proyecto o modelo..."
          />
          <button className="logout" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </header>

        <Routes>
          <Route
            path="/inicio"
            element={
              <HomeView
                catalogItems={catalogItems}
                userName={localStorage.getItem('userName')}
                selectedModel={selectedModel}
                projectName={projectName}
                projectMessage={projectMessage}
                onProjectNameChange={setProjectName}
                onChooseModel={handleChooseModel}
                onCreateProject={handleCreateProject}
              />
            }
          />
          <Route
            path="/mis-proyectos"
            element={
              <ProjectsView
                projectItems={filteredProjects}
                userName={localStorage.getItem('userName')}
                onToggleFavorite={toggleFavoriteProject}
              />
            }
          />
          <Route
            path="/favoritos"
            element={<FavoritesView favoriteItems={favoriteProjects} onToggleFavorite={toggleFavoriteProject} />}
          />
          <Route path="/configuracion" element={<SettingsView />} />
          <Route path="/ayuda" element={<HelpView />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </section>
    </main>
  )
}

function HomeView({
  catalogItems,
  userName,
  selectedModel,
  projectName,
  projectMessage,
  onProjectNameChange,
  onChooseModel,
  onCreateProject,
}) {
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
            <div className="card-actions">
              <button type="button" className="card-btn" onClick={() => onChooseModel(item)}>
                Elegir modelo
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="content-view project-creator">
        <div className="page-header">
          <h2>Crear proyecto rapido</h2>
          <p>Escoge un modelo, pon nombre y guarlo en Mis proyectos.</p>
        </div>
        {projectMessage ? <p className="login-success">{projectMessage}</p> : null}
        <form onSubmit={onCreateProject} className="project-form">
          <label htmlFor="selectedModel">Modelo seleccionado</label>
          <input
            id="selectedModel"
            type="text"
            value={selectedModel ? selectedModel.title : 'Aun no seleccionas modelo'}
            readOnly
          />
          <label htmlFor="projectName">Nombre del proyecto</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            placeholder="Ejemplo: Mesa oficina abril"
            required
          />
          <button type="submit" disabled={!selectedModel || !projectName.trim()}>
            Guardar en mis proyectos
          </button>
        </form>
      </section>
    </>
  )
}

function ProjectsView({ projectItems, userName, onToggleFavorite }) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Mis proyectos</h2>
        <p>Vista de proyectos creados por {userName || 'el usuario actual'}.</p>
      </div>
      {projectItems.length === 0 ? (
        <div className="empty-state">
          <p>No hay proyectos aun. Ve a Inicio y crea uno desde un modelo.</p>
        </div>
      ) : null}
      <div className="projects-table">
        {projectItems.map((project) => (
          <article className="project-row" key={project.id}>
            <img src={project.image} alt={project.name} className="project-thumb" />
            <div>
              <h3>{project.name}</h3>
              <p>
                {project.model} - {project.category}
              </p>
            </div>
            <span>{project.updatedAt}</span>
            <button type="button" onClick={() => onToggleFavorite(project.id)}>
              {project.isFavorite ? 'Quitar favorito' : 'Agregar favorito'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function FavoritesView({ favoriteItems, onToggleFavorite }) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Favoritos</h2>
        <p>Proyectos destacados para acceso rapido.</p>
      </div>
      {favoriteItems.length === 0 ? (
        <div className="empty-state">
          <p>Aun no tienes favoritos. Desde Mis proyectos puedes marcarlos.</p>
        </div>
      ) : (
        <div className="projects-table">
          {favoriteItems.map((project) => (
            <article className="project-row" key={project.id}>
              <img src={project.image} alt={project.name} className="project-thumb" />
              <div>
                <h3>{project.name}</h3>
                <p>{project.model}</p>
              </div>
              <span>{project.updatedAt}</span>
              <button type="button" onClick={() => onToggleFavorite(project.id)}>
                Quitar favorito
              </button>
            </article>
          ))}
        </div>
      )}
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
