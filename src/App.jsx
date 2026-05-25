import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  fetchModelos,
  fetchProyectos,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  toggleFavoritoApi,
  loginWithGoogle,
} from './services/api.js'
import './App.css'

const API_BASE_URL = 'http://localhost:3001/api'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const FURNITURE_CATEGORIES = [
  {
    name: 'Sala',
    image: '/images/Categorias_muebles/CAT_SALA.jpeg',
    subcategories: ['Sofás', 'Mesas de centro', 'Muebles TV', 'Libreros', 'Repisas'],
    keywords: ['sala', 'sofa', 'tv', 'librero', 'repisa'],
  },
  {
    name: 'Cocina',
    image: '/images/Categorias_muebles/CAT_COCINA.jpeg',
    subcategories: ['Alacenas', 'Islas', 'Gabinetes', 'Barras', 'Despensas'],
    keywords: ['cocina', 'alacena', 'isla', 'gabinete', 'barra', 'despensa'],
  },
  {
    name: 'Recámara',
    image: '/images/Categorias_muebles/CAT_RECAMARA.jpeg',
    subcategories: ['Camas', 'Closets', 'Burós', 'Tocadores', 'Cabeceras'],
    keywords: ['recamara', 'cama', 'closet', 'buro', 'tocador', 'cabecera', 'zapatero'],
  },
  {
    name: 'Oficina',
    image: '/images/Categorias_muebles/CAT_OFICINA.jpeg',
    subcategories: ['Escritorios', 'Sillas', 'Archiveros', 'Estanterías', 'Mesas de trabajo'],
    keywords: ['oficina', 'escritorio', 'silla', 'archivero', 'estanteria', 'mesa de trabajo'],
  },
  {
    name: 'Baño',
    image: '/images/Categorias_muebles/CAT_BANO.jpeg',
    subcategories: ['Muebles lavabo', 'Espejos', 'Repisas', 'Gabinetes'],
    keywords: ['bano', 'lavabo', 'espejo', 'repisa', 'gabinete'],
  },
  {
    name: 'Comedor',
    image: '/images/Categorias_muebles/CAT_COMEDOR.jpeg',
    subcategories: ['Mesas', 'Sillas', 'Vitrinas', 'Bancas'],
    keywords: ['comedor', 'mesa', 'silla', 'vitrina', 'banca'],
  },
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCategorySlug(categoryName) {
  return normalizeText(categoryName).replace(/\s+/g, '-')
}

function getModelsForCategory(category, catalogItems) {
  const categoryWords = [category.name, ...category.subcategories, ...category.keywords].map(normalizeText)

  return catalogItems.filter((item) => {
    const text = normalizeText(`${item.title} ${item.nombre_modelo} ${item.category}`)
    return categoryWords.some((word) => word && text.includes(word))
  })
}

function MenuIcon({ name }) {
  const icons = {
    inicio: (
      <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
    ),
    proyectos: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5zM8 8h8M8 12h8M8 16h5" />
    ),
    favoritos: (
      <path d="m12 17.3 5.6 3.4-1.5-6.4 5-4.3-6.6-.6L12 3.3 9.5 9.4 3 10l5 4.3-1.5 6.4z" />
    ),
    crear: (
      <path d="M12 5v14M5 12h14" />
    ),
    configuracion: (
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.2-2.2.1-1.3-.1-1.3 2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.2-1.3L14.2 3h-4.4l-.4 2.5a8 8 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.5-.1 1.3.1 1.3-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.2 1.3l.4 2.5h4.4l.4-2.5a8 8 0 0 0 2.2-1.3l2.4 1 2-3.4z" />
    ),
    ayuda: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-6v.1M9.8 9.2A2.4 2.4 0 0 1 12.1 7c1.4 0 2.4.9 2.4 2.1 0 1.8-2.4 2-2.4 4" />
    ),
  }

  return (
    <svg className="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function App() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userId, setUserId] = useState(() => Number(localStorage.getItem('userId')) || null)
  const [catalogItems, setCatalogItems] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [selectedModel, setSelectedModel] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectMessage, setProjectMessage] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editorInitialMeasures, setEditorInitialMeasures] = useState(null)
  const [editorInitialFavorite, setEditorInitialFavorite] = useState(true)

  const loadCatalog = async () => {
    try {
      const modelos = await fetchModelos()
      setCatalogItems(modelos)
    } catch {
      setCatalogItems([])
    }
  }

  const loadProjects = async (uid) => {
    if (!uid) return
    setIsLoadingData(true)
    try {
      const list = await fetchProyectos(uid)
      setProjects(list)
    } catch {
      setProjects([])
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadCatalog()
      loadProjects(userId)
    }
  }, [isLoggedIn, userId])

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

  const completeSession = (user) => {
    localStorage.setItem('authToken', 'session-local')
    localStorage.setItem('userName', user?.nombre ?? '')
    localStorage.setItem('userId', String(user?.id_usuario ?? ''))
    localStorage.setItem('isLoggedIn', 'true')
    setUserId(user?.id_usuario)
    setIsLoggedIn(true)
    setError('')
    navigate('/inicio')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Credenciales invalidas')
      }

      completeSession(data.user)
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesion. Verifica email y contrasena.')
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
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar la cuenta')
      }

      setSuccess('Cuenta creada. Ya puedes iniciar sesion con tu email o con Google.')
      setIsRegisterMode(false)
      setName('')
      setPassword('')
    } catch (registerError) {
      setError(registerError.message || 'No se pudo registrar la cuenta.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (response) => {
    if (!response?.credential) return
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const user = await loginWithGoogle(response.credential)
      completeSession(user)
    } catch (googleError) {
      setError(googleError.message || 'No se pudo iniciar sesion con Google.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('No se pudo completar el inicio de sesion con Google.')
  }

  const toggleAuthMode = () => {
    setIsRegisterMode((previousMode) => !previousMode)
    setError('')
    setSuccess('')
    setName('')
    setPassword('')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userId')
    setUserId(null)
    setCatalogItems([])
    setProjects([])
    setIsLoggedIn(false)
    setName('')
    setEmail('')
    setPassword('')
    setSearchTerm('')
    setSelectedModel(null)
    setProjectName('')
    setProjectMessage('')
    setEditingProjectId(null)
    setEditorInitialMeasures(null)
    setEditorInitialFavorite(true)
    navigate('/')
  }

  const handleChooseModel = (model) => {
    setSelectedModel(model)
    setProjectName(`${model.title} ${new Date().getFullYear()}`)
    setProjectMessage('')
    setEditingProjectId(null)
    setEditorInitialMeasures(null)
    setEditorInitialFavorite(true)

    if (model?.diagram) {
      navigate('/mueble')
    }
  }

  const handleEditProject = (project) => {
    const model = catalogItems.find(
      (item) => item.id_modelo === project.id_modelo || item.title === project.model,
    )
    if (!model || !model.diagram) {
      window.alert('Este proyecto no tiene un diagrama editable.')
      return
    }

    setSelectedModel(model)
    setEditingProjectId(project.id)
    setEditorInitialMeasures(project.measures || model.base)
    setEditorInitialFavorite(!!project.isFavorite)
    setProjectName(project.name)
    setProjectMessage('')
    navigate('/mueble')
  }

  const handleDeleteProject = async (projectId) => {
    const confirmDelete = window.confirm('Seguro que deseas eliminar este proyecto?')
    if (!confirmDelete || !userId) return
    try {
      await deleteProyecto(projectId, userId)
      setProjects((previous) => previous.filter((p) => p.id !== projectId))
    } catch (error) {
      window.alert(error.message || 'No se pudo eliminar el proyecto.')
    }
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    if (!selectedModel || !projectName.trim() || !userId) return

    try {
      const proyecto = await createProyecto({
        id_usuario: userId,
        id_modelo: selectedModel.id_modelo,
        nombre_proyecto: projectName.trim(),
        measures: selectedModel.base || {
          anchoTotal: 100,
          altoTotal: 100,
          fondo: 50,
          anchoSuperior: 100,
          altoLateral: 50,
        },
        es_favorito: false,
      })
      setProjects((previous) => [proyecto, ...previous])
      setProjectMessage('Proyecto creado correctamente y agregado a Mis proyectos.')
      setSelectedModel(null)
      setProjectName('')
      navigate('/mis-proyectos')
    } catch (error) {
      window.alert(error.message || 'No se pudo crear el proyecto.')
    }
  }

  const handleSaveProjectFromEditor = async ({ name, isFavorite, measures }) => {
    if (!selectedModel || !selectedModel.diagram || !userId) return

    try {
      if (editingProjectId) {
        const updated = await updateProyecto(editingProjectId, {
          id_usuario: userId,
          nombre_proyecto: name.trim(),
          measures,
          es_favorito: isFavorite,
        })
        setProjects((previous) =>
          previous.map((p) => (p.id === editingProjectId ? updated : p)),
        )
      } else {
        const created = await createProyecto({
          id_usuario: userId,
          id_modelo: selectedModel.id_modelo,
          nombre_proyecto: name.trim(),
          measures,
          es_favorito: isFavorite,
        })
        setProjects((previous) => [created, ...previous])
      }

      setSelectedModel(null)
      setProjectName('')
      setProjectMessage('')
      setEditingProjectId(null)
      setEditorInitialMeasures(null)
      setEditorInitialFavorite(true)
      navigate('/mis-proyectos')
    } catch (error) {
      window.alert(error.message || 'No se pudo guardar el proyecto.')
    }
  }

  const toggleFavoriteProject = async (projectId) => {
    if (!userId) return
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const newValue = !project.isFavorite
    try {
      await toggleFavoritoApi(projectId, userId, newValue)
      setProjects((previous) =>
        previous.map((p) => (p.id === projectId ? { ...p, isFavorite: newValue } : p)),
      )
    } catch (error) {
      window.alert(error.message || 'No se pudo actualizar favorito.')
    }
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
            <h1>{isRegisterMode ? 'Crear cuenta' : 'Bienvenido'}</h1>
            <p className="login-help">
              {isRegisterMode
                ? 'Crea tu cuenta para disenar y guardar tus muebles.'
                : 'Accede para crear proyectos, favoritos y despieces en PDF.'}
            </p>

            <div className="login-google">
              {GOOGLE_CLIENT_ID ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text={isRegisterMode ? 'signup_with' : 'signin_with'}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="320"
                  locale="es"
                />
              ) : (
                <p className="login-google-hint">
                  Configura <strong>VITE_GOOGLE_CLIENT_ID</strong> en un archivo <strong>.env</strong>{' '}
                  para activar el acceso con Google.
                </p>
              )}
            </div>

            <p className="login-divider">
              <span>o continua con email</span>
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

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
              />

              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caracteres"
                minLength={6}
                required
              />

              {error ? <p className="login-error">{error}</p> : null}
              {success ? <p className="login-success">{success}</p> : null}

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Procesando...' : isRegisterMode ? 'Crear cuenta' : 'Entrar con email'}
              </button>
              <button type="button" className="secondary-btn" onClick={toggleAuthMode}>
                {isRegisterMode ? 'Ya tengo cuenta' : 'Crear cuenta con email'}
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
        <p className="brand icon-brand">B</p>
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item ${isActive ? 'active' : ''}`}
          to="/inicio"
          aria-label="Inicio"
          title="Inicio"
        >
          <MenuIcon name="inicio" />
          <span className="menu-tooltip">Inicio</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item ${isActive ? 'active' : ''}`}
          to="/mis-proyectos"
          aria-label="Mis proyectos"
          title="Mis proyectos"
        >
          <MenuIcon name="proyectos" />
          <span className="menu-tooltip">Mis proyectos</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item ${isActive ? 'active' : ''}`}
          to="/favoritos"
          aria-label="Favoritos"
          title="Favoritos"
        >
          <MenuIcon name="favoritos" />
          <span className="menu-tooltip">Favoritos</span>
        </NavLink>
        <button
          type="button"
          className="menu-item icon-menu-item create-menu-item"
          onClick={() => navigate('/inicio')}
          aria-label="Crear"
          title="Crear"
        >
          <MenuIcon name="crear" />
          <span className="menu-tooltip">Crear</span>
        </button>
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item ${isActive ? 'active' : ''}`}
          to="/configuracion"
          aria-label="Configuracion"
          title="Configuracion"
        >
          <MenuIcon name="configuracion" />
          <span className="menu-tooltip">Configuracion</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item ${isActive ? 'active' : ''}`}
          to="/ayuda"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <MenuIcon name="ayuda" />
          <span className="menu-tooltip">Ayuda</span>
        </NavLink>
      </aside>

      <section className="content">
        <header className="topbar">
          {isCategoryRoute ? <span className="topbar-title">Explorar categoria</span> : <span />}
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
            path="/categoria/:categorySlug"
            element={
              <CategoryView
                catalogItems={catalogItems}
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
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            }
          />
          <Route
            path="/mueble"
            element={
              selectedModel?.diagram ? (
                <MuebleEditorView
                  model={selectedModel}
                  onSave={handleSaveProjectFromEditor}
                  isEditing={!!editingProjectId}
                  initialName={projectName}
                  initialMeasures={editorInitialMeasures}
                  initialFavorite={editorInitialFavorite}
                />
              ) : (
                <Navigate to="/inicio" replace />
              )
            }
          />
          <Route
            path="/favoritos"
            element={
              <FavoritesView
                favoriteItems={favoriteProjects}
                onToggleFavorite={toggleFavoriteProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            }
          />
          <Route path="/configuracion" element={<SettingsView />} />
          <Route path="/ayuda" element={<HelpView />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </section>
    </main>
  )
}

function FavoriteStarButton({ isFavorite, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className={`star-btn ${isFavorite ? 'is-favorite' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos')}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
          fill={isFavorite ? '#d4a35a' : 'none'}
          stroke={isFavorite ? '#8b4513' : '#a08568'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function HomeView({ catalogItems, userName }) {
  const navigate = useNavigate()

  return (
    <>
      <section className="inspiration-hero">
        <div>
          <p className="section-label">Catalogo por espacios</p>
          <h2>Hola {userName || 'usuario'}, manten la inspiracion</h2>
          <p>
            Elige una categoria principal para ver sus subcategorias, modelos disponibles y buscador.
          </p>
        </div>
      </section>

      <section className="category-gallery" aria-label="Categorias principales">
        {FURNITURE_CATEGORIES.map((category) => (
          <button
            type="button"
            className="category-card"
            key={category.name}
            onClick={() => navigate(`/categoria/${getCategorySlug(category.name)}`)}
          >
            {category.image ? (
              <img src={category.image} alt={`Categoria ${category.name}`} />
            ) : (
              <span className="category-placeholder">{category.name}</span>
            )}
            <span className="category-overlay">
              <small>{category.subcategories.length} secciones</small>
              <strong>{category.name}</strong>
            </span>
          </button>
        ))}
      </section>

      {catalogItems.length === 0 ? (
        <section className="content-view inspiration-helper">
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>
              No hay muebles en la base de datos. Ejecuta el archivo{' '}
              <strong>backend/seed.sql</strong> en PostgreSQL y reinicia el backend.
            </p>
          </div>
        </section>
      ) : null}
    </>
  )
}

function CategoryView({
  catalogItems,
  selectedModel,
  projectName,
  projectMessage,
  onProjectNameChange,
  onChooseModel,
  onCreateProject,
}) {
  const { categorySlug } = useParams()
  const [categorySearch, setCategorySearch] = useState('')
  const category = FURNITURE_CATEGORIES.find(
    (item) => getCategorySlug(item.name) === categorySlug,
  )

  if (!category) {
    return <Navigate to="/inicio" replace />
  }

  const categoryModels = getModelsForCategory(category, catalogItems)
  const normalizedSearch = normalizeText(categorySearch)
  const visibleSubcategories = category.subcategories.filter((subcategory) =>
    normalizeText(`${subcategory} ${category.name}`).includes(normalizedSearch),
  )
  const visibleModels = categoryModels.filter((item) =>
    normalizeText(`${item.title} ${item.nombre_modelo} ${item.category}`).includes(
      normalizedSearch,
    ),
  )
  const hasSearch = normalizedSearch.length > 0
  const showEmptySearch = hasSearch && visibleSubcategories.length === 0 && visibleModels.length === 0

  return (
    <>
      <section className="category-detail-hero">
        {category.image ? (
          <img src={category.image} alt={`Categoria ${category.name}`} />
        ) : (
          <span className="category-placeholder">{category.name}</span>
        )}
        <div>
          <p className="section-label">Categoria</p>
          <h2>{category.name}</h2>
          <p>Busca dentro de esta categoria o elige un modelo para crear tu proyecto.</p>
        </div>
      </section>

      <section className="content-view category-section">
        <div className="category-toolbar">
          <input
            className="search category-search"
            type="text"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder={`Buscar en ${category.name}: mueble, subcategoria o modelo...`}
          />
          <button type="button" className="secondary-link" onClick={() => setCategorySearch('')}>
            Limpiar
          </button>
        </div>

        <div className="category-section-header">
          <div>
            <p className="section-label">Subcategorias</p>
            <h2>{category.name}</h2>
          </div>
          <span>{visibleModels.length} modelos disponibles</span>
        </div>

        <div className="subcategory-grid">
          {(hasSearch ? visibleSubcategories : category.subcategories).map((subcategory) => (
            <span className="subcategory-chip" key={subcategory}>
              {subcategory}
            </span>
          ))}
        </div>

        <div className="catalog-grid compact">
          {visibleModels.map((item) => (
            <article className="card" key={item.id_modelo ?? item.title}>
              <img src={item.image} alt={item.title} />
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <div className="card-actions">
                <button type="button" className="card-btn" onClick={() => onChooseModel(item)}>
                  Elegir mueble
                </button>
              </div>
            </article>
          ))}
        </div>

        {showEmptySearch ? (
          <div className="empty-state soft">
            <p>No encontramos resultados en {category.name} con "{categorySearch}".</p>
          </div>
        ) : null}

        {!hasSearch && categoryModels.length === 0 ? (
          <div className="empty-state soft">
            <p>
              Aun no hay modelos guardados en esta categoria. Puedes agregarlos despues en la base
              de datos.
            </p>
          </div>
        ) : null}
      </section>

      <section className="content-view project-creator">
        <div className="page-header">
          <h2>Crear proyecto rapido</h2>
          <p>Para muebles con diagrama, la edicion de medidas se hace en la pantalla del mueble.</p>
        </div>
        {selectedModel?.diagram ? (
          <div className="empty-state">
            <p>Ya elegiste un mueble con diagrama. Edita sus medidas y guardalo desde alli.</p>
          </div>
        ) : (
          <>
            {projectMessage ? <p className="login-success">{projectMessage}</p> : null}
            <form onSubmit={onCreateProject} className="project-form">
              <label htmlFor="selectedModel">Mueble seleccionado</label>
              <input
                id="selectedModel"
                type="text"
                value={selectedModel ? selectedModel.title : 'Aun no seleccionas mueble'}
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
          </>
        )}
      </section>
    </>
  )
}

function ProjectsView({ projectItems, userName, onToggleFavorite, onEdit, onDelete }) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Mis proyectos</h2>
        <p>Vista de proyectos creados por {userName || 'el usuario actual'}.</p>
      </div>
      {projectItems.length === 0 ? (
        <div className="empty-state">
          <p>No hay proyectos aun. Ve a Inicio y crea uno desde un mueble.</p>
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
            <div className="project-actions">
              <FavoriteStarButton
                isFavorite={!!project.isFavorite}
                onClick={() => onToggleFavorite(project.id)}
              />
              <button type="button" className="action-btn edit" onClick={() => onEdit(project)}>
                Editar
              </button>
              <button
                type="button"
                className="action-btn delete"
                onClick={() => onDelete(project.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function FavoritesView({ favoriteItems, onToggleFavorite, onEdit, onDelete }) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Favoritos</h2>
        <p>Proyectos destacados para acceso rapido.</p>
      </div>
      {favoriteItems.length === 0 ? (
        <div className="empty-state">
          <p>Aun no tienes favoritos. Desde Mis proyectos puedes marcarlos con la estrella.</p>
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
              <div className="project-actions">
                <FavoriteStarButton
                  isFavorite={!!project.isFavorite}
                  onClick={() => onToggleFavorite(project.id)}
                />
                <button type="button" className="action-btn edit" onClick={() => onEdit(project)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="action-btn delete"
                  onClick={() => onDelete(project.id)}
                >
                  Eliminar
                </button>
              </div>
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

function MuebleEditorView({
  model,
  onSave,
  isEditing = false,
  initialName = '',
  initialMeasures = null,
  initialFavorite = true,
}) {
  const navigate = useNavigate()

  const safeModelTitle = model?.title ?? 'Mueble'
  const base = model?.base || {
    anchoTotal: 480,
    altoTotal: 1200,
    fondo: 350,
    anchoSuperior: 450,
    altoLateral: 150,
  }

  const [projectName, setProjectName] = useState(
    () => initialName || `${safeModelTitle} ${new Date().getFullYear()}`,
  )
  const [addToFavorites, setAddToFavorites] = useState(!!initialFavorite)

  const [anchoTotal, setAnchoTotal] = useState(initialMeasures?.anchoTotal ?? base.anchoTotal)
  const [altoTotal, setAltoTotal] = useState(initialMeasures?.altoTotal ?? base.altoTotal)
  const [fondo, setFondo] = useState(initialMeasures?.fondo ?? base.fondo)

  const ANCHO_MIN = Math.round(base.anchoTotal * 0.85)
  const ANCHO_MAX = Math.round(base.anchoTotal * 1.15)
  const ALTO_MIN = Math.round(base.altoTotal * 0.85)
  const ALTO_MAX = Math.round(base.altoTotal * 1.15)
  const FONDO_MIN = Math.round(base.fondo * 0.85)
  const FONDO_MAX = Math.round(base.fondo * 1.15)

  const anchoSuperior = Math.round((base.anchoSuperior / base.anchoTotal) * anchoTotal)
  const altoLateral = Math.round((base.altoLateral / base.altoTotal) * altoTotal)

  useEffect(() => {
    setProjectName(initialName || `${safeModelTitle} ${new Date().getFullYear()}`)
    setAnchoTotal(initialMeasures?.anchoTotal ?? base.anchoTotal)
    setAltoTotal(initialMeasures?.altoTotal ?? base.altoTotal)
    setFondo(initialMeasures?.fondo ?? base.fondo)
    setAddToFavorites(!!initialFavorite)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeModelTitle, initialName, initialMeasures, initialFavorite])

  const handleSave = (event) => {
    event.preventDefault()
    if (!projectName.trim()) return

    onSave({
      name: projectName,
      isFavorite: addToFavorites,
      measures: {
        anchoTotal,
        altoTotal,
        fondo,
        anchoSuperior,
        altoLateral,
      },
    })
  }

  const handleGeneratePdf = async () => {
    const measures = { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral }
    try {
      await generateDespiecePdf({ projectName, model, measures })
    } catch {
      window.alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
  }

  if (!model?.diagram) return null

  return (
    <section className="content-view mueble-editor">
      <div className="page-header">
        <h2>
          {isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}: {model.title}
        </h2>
        <p>Modifica las medidas dentro del rango permitido para mantener la proporcion del mueble.</p>
      </div>

      <div className="editor-grid">
        <div className="diagram-stage">
          <div className="diagram-wrapper">
            <img src={model.diagram} alt={`Diagrama de ${model.title}`} className="diagram-img" />

            <div className="diagram-label" style={{ left: '40%', top: '4%' }}>
              {anchoSuperior}
            </div>
            <div className="diagram-label" style={{ left: '60%', top: '14%' }}>
              {altoLateral}
            </div>
            <div className="diagram-label" style={{ left: '40%', top: '94%' }}>
              {anchoTotal}
            </div>
            <div className="diagram-label diagram-label-rot" style={{ left: '6%', top: '50%' }}>
              {altoTotal}
            </div>
            <div className="diagram-label" style={{ left: '74%', top: '60%' }}>
              {fondo}
            </div>
          </div>
        </div>

        <form className="editor-controls" onSubmit={handleSave}>
          <label htmlFor="projectName">Nombre del proyecto</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            required
          />

          <label htmlFor="anchoTotal">Ancho total (mm)</label>
          <input
            id="anchoTotal"
            type="number"
            value={anchoTotal}
            min={ANCHO_MIN}
            max={ANCHO_MAX}
            step={1}
            onChange={(event) => setAnchoTotal(Number(event.target.value))}
            required
          />
          <div className="editor-hint">
            Rango: {ANCHO_MIN} - {ANCHO_MAX} mm. Ancho superior: {anchoSuperior} mm
          </div>

          <label htmlFor="altoTotal">Altura total (mm)</label>
          <input
            id="altoTotal"
            type="number"
            value={altoTotal}
            min={ALTO_MIN}
            max={ALTO_MAX}
            step={1}
            onChange={(event) => setAltoTotal(Number(event.target.value))}
            required
          />
          <div className="editor-hint">
            Rango: {ALTO_MIN} - {ALTO_MAX} mm. Altura lateral: {altoLateral} mm
          </div>

          <label htmlFor="fondo">Fondo (mm)</label>
          <input
            id="fondo"
            type="number"
            value={fondo}
            min={FONDO_MIN}
            max={FONDO_MAX}
            step={1}
            onChange={(event) => setFondo(Number(event.target.value))}
            required
          />
          <div className="editor-hint">
            Rango: {FONDO_MIN} - {FONDO_MAX} mm
          </div>

          <label className="favorite-row">
            <input
              type="checkbox"
              checked={addToFavorites}
              onChange={(event) => setAddToFavorites(event.target.checked)}
            />
            <span>Agregar a favoritos</span>
          </label>

          <div className="editor-actions">
            <button type="submit" className="primary-btn">
              {isEditing ? 'Guardar cambios' : 'Guardar en Mis proyectos'}
            </button>
            <button type="button" className="pdf-btn" onClick={handleGeneratePdf}>
              Generar PDF de despiece
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(isEditing ? '/mis-proyectos' : '/inicio')}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function buildZapateroPieces(measures) {
  const { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral } = measures

  const columnaLargo = Math.round(altoTotal - 168)
  const lateralLargo = Math.round(altoLateral - 36)
  const repisaLargo = Math.round(260 * (anchoTotal / 480))
  const lateralCajonLargo = Math.round(300 * (fondo / 350))
  const frenteCajonLargo = Math.round(352 * (anchoSuperior / 450))
  const tapaCajonLargo = Math.round(104 * (anchoSuperior / 450))
  const tapaCajonAncho = Math.round(404 * (anchoSuperior / 450))
  const fondoCajonLargo = Math.round(278 * (anchoSuperior / 450))
  const fondoCajonAncho = Math.round(366 * (fondo / 350))

  return [
    { num: 1, nombre: 'COLUMNA', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 0, cantoInf: 0 },
    { num: 2, nombre: 'VERTICAL', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 3, nombre: 'BASE', alto: anchoTotal, ancho: fondo, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 4, nombre: 'REPISA', alto: repisaLargo, ancho: fondo, cantidad: 12, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 5, nombre: 'LATERAL', alto: lateralLargo, ancho: fondo, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 6, nombre: 'BASE Y TECHO', alto: anchoSuperior, ancho: fondo, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: lateralCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: frenteCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 9, nombre: 'TAPA DE CAJON', alto: tapaCajonLargo, ancho: tapaCajonAncho, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 10, nombre: 'FONDO DE CAJON', alto: fondoCajonLargo, ancho: fondoCajonAncho, cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: 0, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
  ]
}

async function loadImage(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return await new Promise((resolve) => {
      const img = new Image()
      img.onload = () =>
        resolve({
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: blob.type === 'image/png' ? 'PNG' : 'JPEG',
        })
      img.onerror = () => resolve(null)
      img.src = dataUrl
    })
  } catch {
    return null
  }
}

async function generateDespiecePdf({ projectName, model, measures }) {
  const pieces = buildZapateroPieces(measures)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 36

  // Caoba band
  doc.setFillColor(93, 47, 26)
  doc.rect(0, 0, pageWidth, 56, 'F')
  doc.setTextColor(245, 225, 179)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Despiece de mueble', marginX, 36)

  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Proyecto: ${projectName || '—'}`, marginX, 78)
  doc.text(`Mueble: ${model?.title || '—'}`, marginX, 94)
  doc.text(
    `Medidas generales: ${measures.anchoTotal} x ${measures.altoTotal} x ${measures.fondo} mm  (ancho x alto x fondo)`,
    marginX,
    110,
  )
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, marginX, 126)

  // Images
  const imagesTopY = 148
  const imageBlockHeight = 180
  const [muebleImg, diagramImg] = await Promise.all([
    model?.image ? loadImage(model.image) : null,
    model?.diagram ? loadImage(model.diagram) : null,
  ])

  if (muebleImg) {
    const maxW = 170
    const maxH = imageBlockHeight
    const ratio = muebleImg.width / muebleImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    doc.addImage(muebleImg.dataUrl, muebleImg.format, marginX, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Vista del mueble', marginX, imagesTopY + imageBlockHeight + 14)
  }

  if (diagramImg) {
    const maxW = 240
    const maxH = imageBlockHeight
    const ratio = diagramImg.width / diagramImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const xPos = pageWidth - marginX - w
    doc.addImage(diagramImg.dataUrl, diagramImg.format, xPos, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Diagrama del despiece', xPos, imagesTopY + imageBlockHeight + 14)
  }

  const accessoriesY = imagesTopY + imageBlockHeight + 34
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Accesorios basicos:', marginX, accessoriesY)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    'Tornillos 4 x 50, 4 x 40, 3.5 x 17 - 1 par de correderas 30 cm',
    marginX,
    accessoriesY + 16,
  )

  const head = [
    [
      '#',
      'Pieza',
      'Cant.',
      'Alto (mm)',
      'Ancho (mm)',
      'Material',
      'Giro',
      'Canto Izq',
      'Canto Der',
      'Canto Sup',
      'Canto Inf',
    ],
  ]

  const body = pieces.map((piece) => [
    piece.num,
    piece.nombre,
    piece.cantidad,
    piece.alto,
    piece.ancho,
    piece.material,
    piece.giro,
    piece.cantoIzq,
    piece.cantoDer,
    piece.cantoSup,
    piece.cantoInf,
  ])

  autoTable(doc, {
    head,
    body,
    startY: accessoriesY + 34,
    theme: 'grid',
    styles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      lineColor: [201, 176, 139],
      textColor: [59, 36, 24],
    },
    headStyles: {
      fillColor: [139, 69, 19],
      textColor: [248, 238, 221],
      fontStyle: 'bold',
      lineColor: [93, 47, 26],
    },
    alternateRowStyles: { fillColor: [248, 238, 221] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 110, halign: 'left' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 55 },
      5: { cellWidth: 60 },
      6: { cellWidth: 30 },
      7: { cellWidth: 40 },
      8: { cellWidth: 40 },
      9: { cellWidth: 40 },
      10: { cellWidth: 40 },
    },
    margin: { left: marginX, right: marginX },
  })

  const finalY = doc.lastAutoTable?.finalY || accessoriesY + 60
  const noteY = finalY + 22
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Cubrecanto', marginX, noteY)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    'Colocar "1" si necesita cubrecanto y "0" si no lo necesita en cada lado de la pieza.',
    marginX,
    noteY + 14,
    { maxWidth: pageWidth - marginX * 2 },
  )
  doc.text(
    'Giro N = sin rotar la pieza (orientacion como en el diagrama).',
    marginX,
    noteY + 30,
    { maxWidth: pageWidth - marginX * 2 },
  )

  const safeName = (projectName || 'despiece').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'despiece'
  doc.save(`${safeName}.pdf`)
}

export default App
