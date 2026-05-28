import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import MenuIcon from './components/MenuIcon.jsx'
import HomeView from './views/HomeView.jsx'
import CategoryView from './views/CategoryView.jsx'
import ProjectsView from './views/ProjectsView.jsx'
import FavoritesView from './views/FavoritesView.jsx'
import SettingsView from './views/SettingsView.jsx'
import HelpView from './views/HelpView.jsx'
import CreateModelView from './views/CreateModelView.jsx'
import { normalizeText } from './utils/text.js'
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

/**
 * MEDIDAS DERIVADAS (solo UI / PDF en frontend)
 * El usuario edita anchoTotal, altoTotal, fondo (y a veces altoCajonera).
 * Esta funcion calcula medidas secundarias proporcionales (anchoSuperior, altoLateral, etc.)
 * segun el tipo de mueble. Se guardan en medidas_extra al crear el proyecto.
 */
function getDerivedMeasures(base, measures) {
  if (base.tipo === 'estante_sala') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 864) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 260) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 280) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 1400) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 300) * scaleFondo),
    }
  }

  if (base.tipo === 'alacena_cocina') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 1214) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 600) * scaleAlto),
      anchoModulo: Math.round((base.anchoModuloGrande ?? 798) * scaleAncho),
      anchoPuerta: Math.round((base.anchoPuerta ?? 594) * scaleAncho),
      altoPuertaChica: Math.round((base.altoPuerta ?? 408) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 278) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 578) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 1228) * scaleAncho),
    }
  }

  if (base.tipo === 'espejo_bano') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 414) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 600) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 128) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 578) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 428) * scaleAncho),
    }
  }

  if (base.tipo === 'escritorio1') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 364) * scaleAncho),
      altoLateral: Math.round((base.altoPatas ?? 762) * scaleAlto),
      anchoFaldon: Math.round((base.anchoFaldon ?? 582) * scaleAncho),
      fondoTablero: Math.round((base.fondoTablero ?? 470) * scaleFondo),
      altoZocalo: Math.round((base.altoZocalo ?? 100) * scaleAlto),
      altoAmarre: Math.round((base.altoAmarre ?? 70) * scaleAlto),
    }
  }

  if (base.tipo === 'librero_gavetas') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 614) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 1964) * scaleAlto),
      altoCajonera: Math.round((base.altoCajonera ?? 500) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 200) * scaleAlto),
      anchoCajon: Math.round((base.anchoCajon ?? 552) * scaleAncho),
      fondoInterior: Math.round((base.fondoInterior ?? 428) * scaleFondo),
      fondoCajon: Math.round((base.fondoCajon ?? 400) * scaleFondo),
    }
  }

  if (base.tipo === 'mesa_centro') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal

    return {
      anchoSuperior: Math.round((base.anchoSoporteIzq ?? 455) * scaleAncho),
      anchoModulo: Math.round((base.anchoSoporteDer ?? 315) * scaleAncho),
      anchoFrontal: Math.round((base.anchoCajon ?? 600) * scaleAncho),
      altoLateral: Math.round((base.altoModulo ?? 150) * scaleAlto),
      altoCajon: Math.round((base.altoPata ?? 100) * scaleAlto),
      volado: Math.round((base.volado ?? 15) * scaleAncho),
    }
  }

  if (base.tipo === 'mueble_tv') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoCubierta ?? 1200) * scaleAncho),
      altoLateral: Math.round((base.altoModulo ?? 350) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 280) * scaleAlto),
      anchoModulo: Math.round((base.anchoLateral ?? 300) * scaleAncho),
      anchoCajon: Math.round((base.anchoCajon ?? 600) * scaleAncho),
      fondoModulo: Math.round((base.fondoModulo ?? 280) * scaleFondo),
      altoDivisor: Math.round((base.altoDivisor ?? 150) * scaleAlto),
    }
  }

  if (base.tipo === 'closet1') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const altoCajonera = Number(measures.altoCajonera ?? base.altoCajonera ?? 947)

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 1264) * scaleAncho),
      altoLateral: Math.round((base.altoPuertas ?? 1994) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 173) * (altoCajonera / (base.altoCajonera ?? 947))),
      altoCajonera,
      anchoPuerta: Math.round((base.anchoPuerta ?? 425) * scaleAncho),
      altoPuertaChica: positiveDimension(measures.altoTotal - altoCajonera),
      altoVertical: Math.round((base.altoVertical ?? 1964) * scaleAlto),
      anchoCajon: Math.round((base.anchoCajon ?? 353) * scaleAncho),
    }
  }

  if (base.tipo === 'cabecera_cama') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRespaldoHorizontal ?? 1550) * scaleAncho),
      altoLateral: Math.round((base.altoCajonero ?? 650) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 150) * scaleAlto),
      anchoModulo: Math.round((base.anchoModulo ?? 550) * scaleAncho),
      anchoCama: Math.round((base.anchoCama ?? 1350) * scaleAncho),
      fondoSuperior: Math.round((base.fondoSuperior ?? 420) * scaleFondo),
      anchoFrontal: Math.round((base.anchoFrontal ?? 450) * scaleAncho),
    }
  }

  return {
    anchoSuperior: Math.round(((base.anchoSuperior ?? base.anchoTotal) / base.anchoTotal) * measures.anchoTotal),
    altoLateral: Math.round(((base.altoLateral ?? 150) / base.altoTotal) * measures.altoTotal),
    altoCajon: Math.round(((base.altoCajon ?? 100) / base.altoTotal) * measures.altoTotal),
  }
}

function clampNumber(value, min, max) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return min
  return Math.min(Math.max(numericValue, min), max)
}

function validateMeasureRange(value, min, max, label) {
  if (value === '' || value === null || value === undefined) {
    return `${label} es obligatorio.`
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return `${label} debe ser un numero valido.`
  }

  if (numericValue < min || numericValue > max) {
    return `${label} debe estar entre ${min} y ${max} mm.`
  }

  return ''
}

function positiveDimension(value) {
  return Math.max(1, Math.round(value))
}

function normalizeCubrecanto(value) {
  if (typeof value === 'number') return value > 0 ? 1 : 0
  const textValue = String(value || '').trim()
  return textValue && textValue !== '0' ? 1 : 0
}

function getMeasureRanges(base) {
  const defaultRanges = {
    ancho: {
      min: Math.round(base.anchoTotal * 0.85),
      max: Math.round(base.anchoTotal * 1.15),
    },
    alto: {
      min: Math.round(base.altoTotal * 0.85),
      max: Math.round(base.altoTotal * 1.15),
    },
    fondo: {
      min: Math.round(base.fondo * 0.85),
      max: Math.round(base.fondo * 1.15),
    },
  }

  if (base.tipo === 'buro') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 300), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 420), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 300), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'cabecera_cama') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 2000), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 900), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 320), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'closet1') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 900), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 1700), max: defaultRanges.alto.max },
      fondo: { min: base.fondo, max: base.fondo },
      altoCajonera: {
        min: Math.max(Math.round((base.altoCajonera ?? 947) * 0.85), 700),
        max: Math.min(Math.round((base.altoCajonera ?? 947) * 1.15), base.altoTotal - 450),
      },
    }
  }

  if (base.tipo === 'mueble_tv') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 1000), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 900), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'mesa_centro') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 600), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 180), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 450), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'librero_gavetas') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 500), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 1600), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 350), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'escritorio1') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 800), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 650), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 360), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'espejo_bano') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 320), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 450), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 100), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'alacena_cocina') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 950), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 450), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 240), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'estante_sala') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 700), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 800), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
    }
  }

  const minAltoPorPiezas = Math.ceil((36 * base.altoTotal) / (base.altoLateral ?? 150))
  return {
    ancho: { min: Math.max(defaultRanges.ancho.min, 250), max: defaultRanges.ancho.max },
    alto: { min: Math.max(defaultRanges.alto.min, minAltoPorPiezas + 1, 420), max: defaultRanges.alto.max },
    fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
  }
}

function getEditorLabels(model, measures) {
  const base = model?.base || {}
  const derived = getDerivedMeasures(base, measures)
  const allMeasures = { ...measures, ...derived }

  if (base.tipo === 'buro') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '88%', top: '22%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '8%', top: '34%' },
      { key: 'anchoFrontal', value: allMeasures.anchoTotal, left: '31%', top: '49%' },
      { key: 'fondo', value: allMeasures.fondo, left: '88%', top: '72%' },
      { key: 'altoCajon', value: allMeasures.altoCajon, left: '92%', top: '89%' },
      { key: 'anchoPerfil', value: allMeasures.anchoTotal, left: '51%', top: '96%' },
    ]
  }

  if (base.tipo === 'cabecera_cama') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '8%', top: '55%' },
      { key: 'anchoModuloIzq', value: allMeasures.anchoModulo, left: '18%', top: '94%' },
      { key: 'anchoModuloDer', value: allMeasures.anchoModulo, left: '79%', top: '85%' },
      { key: 'anchoCama', value: allMeasures.anchoCama, left: '50%', top: '70%' },
      { key: 'fondo', value: allMeasures.fondo, left: '42%', top: '33%' },
      { key: 'fondoSuperior', value: allMeasures.fondoSuperior, left: '44%', top: '17%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '56%', top: '36%' },
      { key: 'anchoFrontal', value: allMeasures.anchoFrontal, left: '16%', top: '24%' },
      { key: 'anchoRespaldoHorizontal', value: allMeasures.anchoSuperior, left: '49%', top: '57%' },
    ]
  }

  if (base.tipo === 'closet1') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '92%', top: '45%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '50%', top: '95%' },
      { key: 'altoCajonera', value: allMeasures.altoCajonera, left: '84%', top: '73%' },
    ]
  }

  if (base.tipo === 'mueble_tv') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '36%', top: '5%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '4%', top: '39%', rotated: true },
      { key: 'anchoSuperior', value: allMeasures.anchoSuperior, left: '41%', top: '56%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '88%', top: '61%' },
      { key: 'anchoModuloIzq', value: allMeasures.anchoModulo, left: '20%', top: '83%' },
      { key: 'anchoModuloDer', value: allMeasures.anchoModulo, left: '74%', top: '83%' },
      { key: 'anchoCajon', value: allMeasures.anchoCajon, left: '43%', top: '94%' },
      { key: 'altoCajon', value: allMeasures.altoCajon, left: '50%', top: '74%' },
      { key: 'fondoModulo', value: allMeasures.fondoModulo, left: '92%', top: '91%' },
    ]
  }

  if (base.tipo === 'mesa_centro') {
    return [
      { key: 'fondo', value: allMeasures.fondo, left: '51%', top: '22%' },
      { key: 'anchoSuperior', value: allMeasures.anchoTotal, left: '38%', top: '45%' },
      { key: 'voladoIzq', value: allMeasures.volado, left: '10%', top: '51%' },
      { key: 'anchoSoporteIzq', value: allMeasures.anchoSuperior, left: '28%', top: '51%' },
      { key: 'anchoSoporteDer', value: allMeasures.anchoModulo, left: '60%', top: '51%' },
      { key: 'voladoDer', value: allMeasures.volado, left: '74%', top: '51%' },
      { key: 'altoModulo', value: allMeasures.altoLateral, left: '79%', top: '63%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '35%', top: '89%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '88%', top: '72%' },
      { key: 'altoPata', value: allMeasures.altoCajon, left: '88%', top: '82%' },
      { key: 'fondoLateral', value: allMeasures.fondo, left: '74%', top: '89%' },
    ]
  }

  if (base.tipo === 'librero_gavetas') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '12%', top: '48%', rotated: true },
      { key: 'fondo', value: allMeasures.fondo, left: '23%', top: '88%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '55%', top: '91%' },
      { key: 'altoCajonera', value: allMeasures.altoCajonera, left: '90%', top: '72%' },
    ]
  }

  if (base.tipo === 'escritorio1') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '52%', top: '15%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '90%', top: '58%' },
      { key: 'fondo', value: allMeasures.fondo, left: '24%', top: '82%' },
    ]
  }

  if (base.tipo === 'espejo_bano') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '90%', top: '58%', rotated: true },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '48%', top: '93%' },
      { key: 'fondo', value: allMeasures.fondo, left: '31%', top: '34%', rotated: true },
    ]
  }

  if (base.tipo === 'alacena_cocina') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '27%', top: '26%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '37%', top: '32%', rotated: true },
    ]
  }

  if (base.tipo === 'estante_sala') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '50%', top: '6%' },
      { key: 'altoLateral1', value: allMeasures.altoLateral, left: '13%', top: '18%' },
      { key: 'altoLateral2', value: allMeasures.altoLateral, left: '86%', top: '33%' },
      { key: 'altoLateral3', value: allMeasures.altoLateral, left: '14%', top: '51%' },
      { key: 'altoLateral4', value: allMeasures.altoLateral, left: '86%', top: '66%' },
      { key: 'altoLateral5', value: allMeasures.altoLateral, left: '14%', top: '83%' },
    ]
  }

  return [
    { key: 'anchoSuperior', value: allMeasures.anchoSuperior, left: '40%', top: '4%' },
    { key: 'altoLateral', value: allMeasures.altoLateral, left: '60%', top: '14%' },
    { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '40%', top: '94%' },
    { key: 'altoTotal', value: allMeasures.altoTotal, left: '6%', top: '50%', rotated: true },
    { key: 'fondo', value: allMeasures.fondo, left: '74%', top: '60%' },
  ]
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
  const isClosetModel = base.tipo === 'closet1'

  const [projectName, setProjectName] = useState(
    () => initialName || `${safeModelTitle} ${new Date().getFullYear()}`,
  )
  const [addToFavorites, setAddToFavorites] = useState(!!initialFavorite)

  const [anchoTotal, setAnchoTotal] = useState(initialMeasures?.anchoTotal ?? base.anchoTotal)
  const [altoTotal, setAltoTotal] = useState(initialMeasures?.altoTotal ?? base.altoTotal)
  const [fondo, setFondo] = useState(initialMeasures?.fondo ?? base.fondo)
  const [altoCajonera, setAltoCajonera] = useState(
    initialMeasures?.altoCajonera ?? base.altoCajonera ?? 947,
  )

  const measureRanges = getMeasureRanges(base)
  const ANCHO_MIN = measureRanges.ancho.min
  const ANCHO_MAX = measureRanges.ancho.max
  const ALTO_MIN = measureRanges.alto.min
  const ALTO_MAX = measureRanges.alto.max
  const FONDO_MIN = measureRanges.fondo.min
  const FONDO_MAX = measureRanges.fondo.max
  const ALTO_CAJONERA_MIN = measureRanges.altoCajonera?.min ?? 0
  const ALTO_CAJONERA_MAX = measureRanges.altoCajonera?.max ?? ALTO_MAX

  const safeMeasures = {
    anchoTotal: clampNumber(anchoTotal, ANCHO_MIN, ANCHO_MAX),
    altoTotal: clampNumber(altoTotal, ALTO_MIN, ALTO_MAX),
    fondo: isClosetModel ? base.fondo : clampNumber(fondo, FONDO_MIN, FONDO_MAX),
    ...(isClosetModel
      ? { altoCajonera: clampNumber(altoCajonera, ALTO_CAJONERA_MIN, ALTO_CAJONERA_MAX) }
      : {}),
  }

  const derivedMeasures = getDerivedMeasures(base, safeMeasures)
  const { anchoSuperior, altoLateral } = derivedMeasures
  const diagramLabels = getEditorLabels(model, safeMeasures)

  const getMeasuresError = () => {
    return (
      validateMeasureRange(anchoTotal, ANCHO_MIN, ANCHO_MAX, 'Ancho total') ||
      validateMeasureRange(altoTotal, ALTO_MIN, ALTO_MAX, 'Altura total') ||
      (isClosetModel
        ? validateMeasureRange(
          altoCajonera,
          ALTO_CAJONERA_MIN,
          Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450),
          'Altura hasta cajones',
        )
        : validateMeasureRange(fondo, FONDO_MIN, FONDO_MAX, 'Fondo'))
    )
  }

  useEffect(() => {
    setProjectName(initialName || `${safeModelTitle} ${new Date().getFullYear()}`)
    setAnchoTotal(initialMeasures?.anchoTotal ?? base.anchoTotal)
    setAltoTotal(initialMeasures?.altoTotal ?? base.altoTotal)
    setFondo(initialMeasures?.fondo ?? base.fondo)
    setAltoCajonera(initialMeasures?.altoCajonera ?? base.altoCajonera ?? 947)
    setAddToFavorites(!!initialFavorite)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeModelTitle, initialName, initialMeasures, initialFavorite])

  const handleSave = (event) => {
    event.preventDefault()
    if (!projectName.trim()) return
    const measuresError = getMeasuresError()
    if (measuresError) {
      window.alert(measuresError)
      return
    }

    onSave({
      name: projectName,
      isFavorite: addToFavorites,
      measures: {
        ...safeMeasures,
        ...derivedMeasures,
      },
    })
  }

  /** Boton "Generar PDF de despiece" dentro del editor de mueble del catalogo */
  const handleGeneratePdf = async () => {
    const measuresError = getMeasuresError()
    if (measuresError) {
      window.alert(measuresError)
      return
    }

    const measures = {
      ...safeMeasures,
      ...derivedMeasures,
    }
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
          <div className="diagram-column">
            <div className="diagram-wrapper">
              <img src={model.diagram} alt={`Diagrama de ${model.title}`} className="diagram-img" />

              {diagramLabels.map((label) => (
                <div
                  className={`diagram-label ${label.rotated ? 'diagram-label-rot' : ''}`}
                  style={{ left: label.left, top: label.top }}
                  key={label.key}
                >
                  {label.value}
                </div>
              ))}
            </div>
            {model.supportDiagram ? (
              <div className="support-diagram">
                <p>Diagrama de apoyo</p>
                <img src={model.supportDiagram} alt={`Diagrama de apoyo de ${model.title}`} />
              </div>
            ) : null}
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
            onBlur={(event) => setAnchoTotal(clampNumber(event.target.value, ANCHO_MIN, ANCHO_MAX))}
            onChange={(event) => setAnchoTotal(event.target.value)}
            required
          />
          <div className="editor-hint">
            Rango: {ANCHO_MIN} - {ANCHO_MAX} mm. Medida proporcional: {anchoSuperior} mm
          </div>

          <label htmlFor="altoTotal">Altura total (mm)</label>
          <input
            id="altoTotal"
            type="number"
            value={altoTotal}
            min={ALTO_MIN}
            max={ALTO_MAX}
            step={1}
            onBlur={(event) => setAltoTotal(clampNumber(event.target.value, ALTO_MIN, ALTO_MAX))}
            onChange={(event) => setAltoTotal(event.target.value)}
            required
          />
          <div className="editor-hint">
            Rango: {ALTO_MIN} - {ALTO_MAX} mm. Altura secundaria: {altoLateral} mm
          </div>

          {isClosetModel ? (
            <>
              <label htmlFor="altoCajonera">Alto hasta cajones (mm)</label>
              <input
                id="altoCajonera"
                type="number"
                value={altoCajonera}
                min={ALTO_CAJONERA_MIN}
                max={Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450)}
                step={1}
                onBlur={(event) =>
                  setAltoCajonera(
                    clampNumber(
                      event.target.value,
                      ALTO_CAJONERA_MIN,
                      Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450),
                    ),
                  )}
                onChange={(event) => setAltoCajonera(event.target.value)}
                required
              />
              <div className="editor-hint">
                Rango: {ALTO_CAJONERA_MIN} - {Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450)} mm.
                Fondo fijo: {base.fondo} mm
              </div>
            </>
          ) : (
            <>
              <label htmlFor="fondo">Fondo (mm)</label>
              <input
                id="fondo"
                type="number"
                value={fondo}
                min={FONDO_MIN}
                max={FONDO_MAX}
                step={1}
                onBlur={(event) => setFondo(clampNumber(event.target.value, FONDO_MIN, FONDO_MAX))}
                onChange={(event) => setFondo(event.target.value)}
                required
              />
              <div className="editor-hint">
                Rango: {FONDO_MIN} - {FONDO_MAX} mm
              </div>
            </>
          )}

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

/* =============================================================================
 * CALCULO DE PIEZAS PARA PDF (solo frontend, catalogo)
 * - Al GUARDAR proyecto: el backend escala con backend/piezas.js -> tabla piezas
 * - Al GENERAR PDF: estas funciones build*Pieces deben dar el mismo resultado
 * Formula tipica: medida_final = medida_base * (medida_usuario / medida_base_modelo)
 * ============================================================================= */

function buildZapateroPieces(measures) {
  const { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral } = measures

  const columnaLargo = positiveDimension(altoTotal - 168)
  const lateralLargo = positiveDimension(altoLateral - 36)
  const repisaLargo = positiveDimension(260 * (anchoTotal / 480))
  const lateralCajonLargo = positiveDimension(300 * (fondo / 350))
  const frenteCajonLargo = positiveDimension(352 * (anchoSuperior / 450))
  const tapaCajonLargo = positiveDimension(104 * (anchoSuperior / 450))
  const tapaCajonAncho = positiveDimension(404 * (anchoSuperior / 450))
  const fondoCajonLargo = positiveDimension(278 * (anchoSuperior / 450))
  const fondoCajonAncho = positiveDimension(366 * (fondo / 350))

  return [
    { num: 1, nombre: 'COLUMNA', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 0, cantoInf: 0 },
    { num: 2, nombre: 'VERTICAL', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 3, nombre: 'BASE', alto: positiveDimension(anchoTotal), ancho: positiveDimension(fondo), cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 4, nombre: 'REPISA', alto: repisaLargo, ancho: positiveDimension(fondo), cantidad: 12, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 5, nombre: 'LATERAL', alto: lateralLargo, ancho: positiveDimension(fondo), cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 6, nombre: 'BASE Y TECHO', alto: positiveDimension(anchoSuperior), ancho: positiveDimension(fondo), cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: lateralCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: frenteCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 9, nombre: 'TAPA DE CAJON', alto: tapaCajonLargo, ancho: tapaCajonAncho, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 10, nombre: 'FONDO DE CAJON', alto: fondoCajonLargo, ancho: fondoCajonAncho, cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: 0, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
  ]
}

function buildBuroPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 500
  const scaleAlto = altoTotal / 650
  const scaleFondo = fondo / 550

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(532 * scaleAlto), ancho: positiveDimension(400 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 2, nombre: 'BASE / REPISA', alto: positiveDimension(464 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'TECHO', alto: positiveDimension(400 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(350 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'FRENTE DE CAJON', alto: positiveDimension(402 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TAPA DE CAJON', alto: positiveDimension(494 * scaleAncho), ancho: positiveDimension(164 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 7, nombre: 'FONDO DE CAJON', alto: positiveDimension(416 * scaleAncho), ancho: positiveDimension(328 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildCabeceraCamaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 2450
  const scaleAlto = altoTotal / 1150
  const scaleFondo = fondo / 400

  return [
    { num: 1, nombre: 'RESPALDO VERTICAL', alto: positiveDimension(1150 * scaleAlto), ancho: positiveDimension(550 * scaleAncho), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'RESPALDO HORIZONTAL', alto: positiveDimension(1550 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'LATERAL DE CAJONERO', alto: positiveDimension(632 * scaleAlto), ancho: positiveDimension(400 * scaleFondo), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'ZOCALOS', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(80 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'AMARRES', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(80 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'FRENTE DE CAJON INTERIOR', alto: positiveDimension(352 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: positiveDimension(350 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: positiveDimension(444 * scaleAncho), ancho: positiveDimension(150 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 9, nombre: 'FONDO DE CAJON', alto: positiveDimension(366 * scaleAncho), ancho: positiveDimension(328 * scaleFondo), cantidad: 2, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildCloset1Pieces(measures) {
  const { anchoTotal, altoTotal, fondo, altoCajonera } = measures
  const scaleAncho = anchoTotal / 1300
  const scaleAlto = altoTotal / 2100
  const scaleFondo = fondo / 600
  const scaleCajonera = altoCajonera / 947

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(2100 * scaleAlto), ancho: positiveDimension(580 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: '' },
    { num: 2, nombre: 'BASE', alto: positiveDimension(1264 * scaleAncho), ancho: positiveDimension(580 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'VERTICAL', alto: positiveDimension(1964 * scaleAlto), ancho: positiveDimension(558 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'REPISA', alto: positiveDimension(831 * scaleAncho), ancho: positiveDimension(558 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'REPISA 2', alto: positiveDimension(415 * scaleAncho), ancho: positiveDimension(558 * scaleFondo), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'ZOCALO / AMARRES', alto: positiveDimension(1264 * scaleAncho), ancho: positiveDimension(100 * scaleCajonera), cantidad: 5, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: positiveDimension(500 * scaleFondo), ancho: positiveDimension(173 * scaleCajonera), cantidad: 8, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 8, nombre: 'FRENTES DE CAJON', alto: positiveDimension(353 * scaleAncho), ancho: positiveDimension(173 * scaleCajonera), cantidad: 8, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 9, nombre: 'TAPA DE CAJON', alto: positiveDimension(201 * scaleFondo), ancho: positiveDimension(425 * scaleAncho), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 10, nombre: 'PUERTAS', alto: positiveDimension(1994 * scaleAlto), ancho: positiveDimension(425 * scaleAncho), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 11, nombre: 'FONDO DE CAJON', alto: positiveDimension(478 * scaleFondo), ancho: positiveDimension(367 * scaleAncho), cantidad: 4, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 12, nombre: 'FONDO DE MUEBLE', alto: positiveDimension(1978 * scaleAlto), ancho: positiveDimension(1278 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 13, nombre: 'PUERTA CHICA', alto: positiveDimension(altoTotal - altoCajonera), ancho: positiveDimension(425 * scaleAncho), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildMuebleTvPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1300
  const scaleAlto = altoTotal / 1200
  const scaleFondo = fondo / 280

  return [
    { num: 1, nombre: 'PANEL RESPALDO TV', alto: positiveDimension(1300 * scaleAncho), ancho: positiveDimension(1200 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 2, nombre: 'CUBIERTA / REPISA SUPERIOR', alto: positiveDimension(1200 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'LATERAL MODULO', alto: positiveDimension(350 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(280 * scaleFondo), ancho: positiveDimension(280 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'BASE / TAPA DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'DIVISOR CENTRAL', alto: positiveDimension(150 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'REPISA LATERAL', alto: positiveDimension(300 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'SOPORTE VERTICAL TRASERO', alto: positiveDimension(1200 * scaleAlto), ancho: positiveDimension(80 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 9, nombre: 'TAPA PERFIL TRASERO', alto: positiveDimension(150 * scaleAlto), ancho: positiveDimension(80 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 10, nombre: 'FRENTE DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(280 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildMesaCentroPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 800
  const scaleAlto = altoTotal / 250
  const scaleFondo = fondo / 600

  return [
    { num: 1, nombre: 'PISO / CUBIERTA', alto: positiveDimension(800 * scaleAncho), ancho: positiveDimension(600 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 2, nombre: 'SOPORTE LARGO', alto: positiveDimension(800 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'SOPORTE CORTO', alto: positiveDimension(440 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL', alto: positiveDimension(285 * scaleFondo), ancho: positiveDimension(120 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'LATERAL CAJON', alto: positiveDimension(250 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TESTERO', alto: positiveDimension(544 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'PISO DE CAJON', alto: positiveDimension(514 * scaleAncho), ancho: positiveDimension(250 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(120 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 9, nombre: 'CORREDERA DE EXTENSION', alto: positiveDimension(250 * scaleFondo), ancho: 0, cantidad: 1, material: 'Herraje', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 10, nombre: 'PATAS', alto: positiveDimension(100 * scaleAlto), ancho: 0, cantidad: 4, material: 'Herraje', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildLibreroGavetasPieces(measures) {
  const { anchoTotal, altoTotal, fondo, altoCajonera } = measures
  const scaleAncho = anchoTotal / 650
  const scaleAlto = altoTotal / 2000
  const scaleFondo = fondo / 450
  const scaleCajonera = (altoCajonera ?? 500) / 500

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(1964 * scaleAlto), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 2, nombre: 'BASE / TECHO', alto: positiveDimension(650 * scaleAncho), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'REPISAS', alto: positiveDimension(614 * scaleAncho), ancho: positiveDimension(428 * scaleFondo), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(400 * scaleFondo), ancho: positiveDimension(200 * scaleCajonera), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'FRENTE DE CAJON', alto: positiveDimension(552 * scaleAncho), ancho: positiveDimension(200 * scaleCajonera), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TAPA DE CAJON', alto: positiveDimension(644 * scaleAncho), ancho: positiveDimension(241 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 7, nombre: 'FONDO DE CAJON', alto: positiveDimension(378 * scaleFondo), ancho: positiveDimension(566 * scaleAncho), cantidad: 2, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FONDO DE MUEBLE', alto: positiveDimension(1978 * scaleAlto), ancho: positiveDimension(628 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 9, nombre: 'AMARRES', alto: positiveDimension(614 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildEscritorio1Pieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1000
  const scaleAlto = altoTotal / 762
  const scaleFondo = fondo / 470

  return [
    { num: 1, nombre: 'PATAS', alto: positiveDimension(762 * scaleAlto), ancho: positiveDimension(450 * scaleFondo), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: '' },
    { num: 2, nombre: 'REPISAS', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'FALDON', alto: positiveDimension(582 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'ZOCALO', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'AMARRES', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(70 * scaleAlto), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'AMARRES 2', alto: positiveDimension(582 * scaleAncho), ancho: positiveDimension(70 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'TABLERO', alto: positiveDimension(1000 * scaleAncho), ancho: positiveDimension(470 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildEspejoBanoPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 450
  const scaleAlto = altoTotal / 600
  const scaleFondo = fondo / 150

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(150 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE Y TECHO', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(150 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'REPISAS', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(128 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'AMARRE 2', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(100 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'PUERTA', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(450 * scaleAncho), cantidad: 1, material: 'Melamina 18mm + espejo', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 6, nombre: 'FONDO DE MUEBLES', alto: positiveDimension(578 * scaleAlto), ancho: positiveDimension(428 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildAlacenaCocinaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1250
  const scaleAlto = altoTotal / 600
  const scaleFondo = fondo / 300

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(300 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE Y TECHO', alto: positiveDimension(1214 * scaleAncho), ancho: positiveDimension(300 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'VERTICAL', alto: positiveDimension(564 * scaleAlto), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'REPISA 1', alto: positiveDimension(798 * scaleAncho), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'REPISA 2', alto: positiveDimension(398 * scaleAncho), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'AMARRE', alto: positiveDimension(1214 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'FONDO MUEBLE', alto: positiveDimension(1228 * scaleAncho), ancho: positiveDimension(578 * scaleAlto), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'PUERTA', alto: positiveDimension(594 * scaleAncho), ancho: positiveDimension(408 * scaleAlto), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildEstanteSalaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 900
  const scaleAlto = altoTotal / 1040
  const scaleFondo = fondo / 280

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(260 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 5, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE O REPISA', alto: positiveDimension(864 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 6, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'FONDO', alto: positiveDimension(1400 * scaleAlto), ancho: positiveDimension(300 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
  ]
}

/** Elige la funcion build* segun tipo en model.base o el titulo del mueble */
function buildPiecesForModel(model, measures) {
  if (model?.base?.tipo === 'estante_sala' || normalizeText(model?.title).includes('estante')) {
    return buildEstanteSalaPieces(measures)
  }
  if (model?.base?.tipo === 'alacena_cocina' || normalizeText(model?.title).includes('alacena')) {
    return buildAlacenaCocinaPieces(measures)
  }
  if (model?.base?.tipo === 'espejo_bano' || normalizeText(model?.title).includes('espejo')) {
    return buildEspejoBanoPieces(measures)
  }
  if (model?.base?.tipo === 'escritorio1' || normalizeText(model?.title).includes('escritorio')) {
    return buildEscritorio1Pieces(measures)
  }
  if (model?.base?.tipo === 'librero_gavetas' || normalizeText(model?.title).includes('librero')) {
    return buildLibreroGavetasPieces(measures)
  }
  if (model?.base?.tipo === 'mesa_centro' || normalizeText(model?.title).includes('mesa de centro')) {
    return buildMesaCentroPieces(measures)
  }
  if (model?.base?.tipo === 'mueble_tv' || normalizeText(model?.title).includes('tv')) {
    return buildMuebleTvPieces(measures)
  }
  if (model?.base?.tipo === 'closet1' || normalizeText(model?.title).includes('closet')) {
    return buildCloset1Pieces(measures)
  }
  if (model?.base?.tipo === 'cabecera_cama' || normalizeText(model?.title).includes('cabecera')) {
    return buildCabeceraCamaPieces(measures)
  }
  if (model?.base?.tipo === 'buro' || normalizeText(model?.title).includes('buro')) {
    return buildBuroPieces(measures)
  }
  return buildZapateroPieces(measures)
}

/**
 * PDF para MODELOS PROPIOS (constructor 2D en CreateModelView).
 * No recalcula piezas: usa measures.pieces tal como el usuario las dibujo.
 * Agrupa piezas iguales y arma tabla con jspdf + jspdf-autotable.
 */
async function generateCustomModelPdf({ projectName, measures }) {
  const pieces = measures?.pieces || []
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 36

  doc.setFillColor(93, 47, 26)
  doc.rect(0, 0, pageWidth, 56, 'F')
  doc.setTextColor(245, 225, 179)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Despiece de modelo propio', marginX, 36)

  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Proyecto: ${projectName || '—'}`, marginX, 78)
  doc.text('Mueble: Modelo personalizado 2D', marginX, 94)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, marginX, 110)

  const groupedPieces = pieces.reduce((summary, piece) => {
    const key = `${piece.name}-${piece.orientation}-${piece.length}-${piece.thickness}-${piece.depth}`
    if (!summary[key]) {
      summary[key] = {
        nombre: piece.name,
        orientacion: piece.orientation === 'vertical' ? 'Vertical' : 'Horizontal',
        largo: piece.length,
        espesor: piece.thickness,
        fondo: piece.depth,
        cantidad: 0,
      }
    }
    summary[key].cantidad += 1
    return summary
  }, {})

  const body = Object.values(groupedPieces).map((piece, index) => [
    index + 1,
    piece.nombre,
    piece.cantidad,
    piece.largo,
    piece.espesor,
    piece.fondo,
    piece.orientacion,
    0,
    0,
    0,
    0,
  ])

  autoTable(doc, {
    head: [
      [
        '#',
        'Pieza',
        'Cant.',
        'Largo (mm)',
        'Espesor (mm)',
        'Fondo (mm)',
        'Orientacion',
        'Canto Izq',
        'Canto Der',
        'Canto Sup',
        'Canto Inf',
      ],
    ],
    body,
    startY: 138,
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
      1: { cellWidth: 105, halign: 'left' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 58 },
      5: { cellWidth: 55 },
      6: { cellWidth: 62 },
      7: { cellWidth: 40 },
      8: { cellWidth: 40 },
      9: { cellWidth: 40 },
      10: { cellWidth: 40 },
    },
    margin: { left: marginX, right: marginX },
  })

  const finalY = doc.lastAutoTable?.finalY || 170
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Nota', marginX, finalY + 22)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    'Este despiece sale de las piezas creadas en el constructor 2D. Los cantos quedan en 0 porque aun no se editan en modelos propios.',
    marginX,
    finalY + 36,
    { maxWidth: pageWidth - marginX * 2 },
  )

  const safeName = (projectName || 'modelo-propio').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'modelo-propio'
  doc.save(`${safeName}.pdf`)
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
  const pieces = buildPiecesForModel(model, measures)
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
  const [muebleImg, diagramImg, supportDiagramImg] = await Promise.all([
    model?.image ? loadImage(model.image) : null,
    model?.diagram ? loadImage(model.diagram) : null,
    model?.supportDiagram ? loadImage(model.supportDiagram) : null,
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
    const maxW = supportDiagramImg ? 190 : 240
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

  if (supportDiagramImg) {
    const maxW = 145
    const maxH = imageBlockHeight
    const ratio = supportDiagramImg.width / supportDiagramImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const xPos = marginX + 190
    doc.addImage(supportDiagramImg.dataUrl, supportDiagramImg.format, xPos, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Diagrama de apoyo', xPos, imagesTopY + imageBlockHeight + 14)
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
    normalizeCubrecanto(piece.cantoIzq),
    normalizeCubrecanto(piece.cantoDer),
    normalizeCubrecanto(piece.cantoSup),
    normalizeCubrecanto(piece.cantoInf),
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
