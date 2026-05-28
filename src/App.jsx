import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import MenuIcon from './components/MenuIcon.jsx'
import HomeView from './views/HomeView.jsx'
import CategoryView from './views/CategoryView.jsx'
import ProjectsView from './views/ProjectsView.jsx'
import FavoritesView from './views/FavoritesView.jsx'
import SettingsView from './views/SettingsView.jsx'
import HelpView from './views/HelpView.jsx'
import CreateModelView from './views/CreateModelView.jsx'
import MuebleEditorView from './views/MuebleEditorView.jsx'
import { generateCustomModelPdf, generateDespiecePdf } from './services/pdf.js'
import { getDerivedMeasures } from './utils/measures.js'
import {
  fetchModelos,
  fetchProyectos,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  createModeloPropio,
  updateModeloPropio,
  deleteModeloPropio,
  toggleModeloPropioFavorito,
  toggleFavoritoApi,
  loginWithGoogle,
  fetchUserProfile,
} from './services/api.js'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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
  const [selectedModel, setSelectedModel] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editorInitialMeasures, setEditorInitialMeasures] = useState(null)
  const [editorInitialFavorite, setEditorInitialFavorite] = useState(true)
  const [editingCustomProject, setEditingCustomProject] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState({
    nombre: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    foto_url: '',
  })

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
    try {
      const list = await fetchProyectos(uid)
      setProjects(list)
    } catch {
      setProjects([])
    }
  }

  const loadUserProfile = async (uid) => {
    if (!uid) return
    try {
      const user = await fetchUserProfile(uid)
      setCurrentUserProfile(user)
      localStorage.setItem('userName', user?.nombre ?? '')
      localStorage.setItem('userEmail', user?.email ?? '')
    } catch {
      setCurrentUserProfile((previous) => ({
        ...previous,
        nombre: localStorage.getItem('userName') || previous.nombre,
        email: localStorage.getItem('userEmail') || previous.email,
      }))
    }
  }

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadCatalog()
      loadProjects(userId)
      loadUserProfile(userId)
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
    localStorage.setItem('userEmail', user?.email ?? '')
    localStorage.setItem('userId', String(user?.id_usuario ?? ''))
    localStorage.setItem('isLoggedIn', 'true')
    setUserId(user?.id_usuario)
    setCurrentUserProfile(user || {})
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
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
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
    setEditingProjectId(null)
    setEditorInitialMeasures(null)
    setEditorInitialFavorite(true)
    setCurrentUserProfile({ nombre: '', email: '', foto_url: '' })
    navigate('/')
  }

  const handleProfileUpdated = (user) => {
    localStorage.setItem('userName', user?.nombre ?? '')
    localStorage.setItem('userEmail', user?.email ?? '')
    setCurrentUserProfile(user || {})
  }

  const handleChooseModel = (model) => {
    setSelectedModel(model)
    setProjectName(`${model.title} ${new Date().getFullYear()}`)
    setEditingProjectId(null)
    setEditorInitialMeasures(null)
    setEditorInitialFavorite(true)

    if (model?.diagram) {
      navigate('/mueble')
    }
  }

  const handleEditProject = (project) => {
    if (project.measures?.custom) {
      setEditingCustomProject(project)
      navigate('/crear-modelo')
      return
    }

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
    navigate('/mueble')
  }

  /** PDF desde Mis proyectos / Favoritos: catalogo -> generateDespiecePdf; modelo 2D -> generateCustomModelPdf */
  const handleDownloadProjectPdf = async (project) => {
    try {
      if (project.measures?.custom) {
        await generateCustomModelPdf({ projectName: project.name, measures: project.measures })
        return
      }

      const model = catalogItems.find(
        (item) => item.id_modelo === project.id_modelo || item.title === project.model,
      )
      if (!model) {
        window.alert('No se encontro el modelo para generar el PDF.')
        return
      }

      const baseMeasures = project.measures || model.base
      const measures = {
        ...baseMeasures,
        ...getDerivedMeasures(model.base, baseMeasures),
      }
      await generateDespiecePdf({ projectName: project.name, model, measures })
    } catch {
      window.alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
  }

  const handleDeleteProject = async (projectId) => {
    const confirmDelete = window.confirm('Seguro que deseas eliminar este proyecto?')
    if (!confirmDelete || !userId) return
    if (String(projectId).startsWith('custom-')) {
      const project = projects.find((p) => p.id === projectId)
      if (!project?.id_modelo_propio) {
        setProjects((previous) => previous.filter((p) => p.id !== projectId))
        return
      }
      try {
        await deleteModeloPropio(project.id_modelo_propio, userId)
        setProjects((previous) => previous.filter((p) => p.id !== projectId))
      } catch (error) {
        window.alert(error.message || 'No se pudo eliminar el modelo propio.')
      }
      return
    }
    try {
      await deleteProyecto(projectId, userId)
      setProjects((previous) => previous.filter((p) => p.id !== projectId))
    } catch (error) {
      window.alert(error.message || 'No se pudo eliminar el proyecto.')
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
      setEditingProjectId(null)
      setEditorInitialMeasures(null)
      setEditorInitialFavorite(true)
      navigate('/mis-proyectos')
    } catch (error) {
      window.alert(error.message || 'No se pudo guardar el proyecto.')
    }
  }

  const handleAddCustomProject = async ({ name, isFavorite, pieces, sidePieces }) => {
    if (!userId) return

    try {
      const payload = {
        id_usuario: userId,
        nombre_proyecto: name,
        pieces,
        sidePieces,
        es_favorito: isFavorite,
      }

      if (editingCustomProject?.id_modelo_propio) {
        const updated = await updateModeloPropio(editingCustomProject.id_modelo_propio, payload)
        setProjects((previous) =>
          previous.map((project) => (project.id === editingCustomProject.id ? updated : project)),
        )
      } else {
        const created = await createModeloPropio(payload)
        setProjects((previous) => [created, ...previous])
      }

      setEditingCustomProject(null)
      navigate('/mis-proyectos')
    } catch (error) {
      window.alert(error.message || 'No se pudo guardar el modelo propio.')
    }
  }

  const toggleFavoriteProject = async (projectId) => {
    if (!userId) return
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const newValue = !project.isFavorite
    if (project.measures?.custom) {
      if (!project.id_modelo_propio) {
        setProjects((previous) =>
          previous.map((p) => (p.id === projectId ? { ...p, isFavorite: newValue } : p)),
        )
        return
      }
      try {
        await toggleModeloPropioFavorito(project.id_modelo_propio, userId, newValue)
        setProjects((previous) =>
          previous.map((p) => (p.id === projectId ? { ...p, isFavorite: newValue } : p)),
        )
      } catch (error) {
        window.alert(error.message || 'No se pudo actualizar el favorito.')
      }
      return
    }
    try {
      await toggleFavoritoApi(projectId, userId, newValue)
      setProjects((previous) =>
        previous.map((p) => (p.id === projectId ? { ...p, isFavorite: newValue } : p)),
      )
    } catch (error) {
      window.alert(error.message || 'No se pudo actualizar favorito.')
    }
  }

  /* ========== PANTALLA LOGIN (sin sesion) ========== */
  if (!isLoggedIn) {
    return (
      <main className="login-screen">
        {/* Imagen izquierda: archivo en public/images/ */}
        <section className="login-visual">
          <img src="/images/pagina_inicio-ses.jpeg" alt="Planos de muebles de melamina" />
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

  /* ========== APP LOGUEADA: menu lateral + contenido ========== */
  return (
    <main className="dashboard">
      {/* Menu lateral: NavLink cambia la URL y resalta el icono activo */}
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
        <NavLink
          className={({ isActive }) => `menu-item icon-menu-item create-menu-item ${isActive ? 'active' : ''}`}
          to="/crear-modelo"
          onClick={() => setEditingCustomProject(null)}
          aria-label="Crear"
          title="Crear"
        >
          <MenuIcon name="crear" />
          <span className="menu-tooltip">Crear</span>
        </NavLink>
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
          <span />
          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-profile"
              onClick={() => navigate('/configuracion')}
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              {currentUserProfile?.foto_url ? (
                <img src={currentUserProfile.foto_url} alt="Foto de perfil" />
              ) : (
                <span>
                  {(currentUserProfile?.nombre || localStorage.getItem('userName') || 'U')
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </button>
            <button className="logout" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>

        {/* Cada Route muestra una pantalla segun la URL */}
        <Routes>
          <Route
            path="/inicio"
            element={
              <HomeView
                catalogItems={catalogItems}
                userName={localStorage.getItem('userName')}
              />
            }
          />
          <Route
            path="/categoria/:categorySlug"
            element={
              <CategoryView
                catalogItems={catalogItems}
                onChooseModel={handleChooseModel}
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
                onDownloadPdf={handleDownloadProjectPdf}
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
                  onGeneratePdf={generateDespiecePdf}
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
            path="/crear-modelo"
            element={
              <CreateModelView
                initialProject={editingCustomProject}
                onAddProject={handleAddCustomProject}
              />
            }
          />
          <Route
            path="/favoritos"
            element={
              <FavoritesView
                favoriteItems={favoriteProjects}
                onToggleFavorite={toggleFavoriteProject}
                onEdit={handleEditProject}
                onDownloadPdf={handleDownloadProjectPdf}
                onDelete={handleDeleteProject}
              />
            }
          />
          <Route
            path="/configuracion"
            element={
              <SettingsView
                userId={userId}
                initialUserName={localStorage.getItem('userName') || ''}
                initialUserEmail={localStorage.getItem('userEmail') || email}
                onProfileUpdated={handleProfileUpdated}
              />
            }
          />
          <Route path="/ayuda" element={<HelpView />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </section>
    </main>
  )
}

export default App
