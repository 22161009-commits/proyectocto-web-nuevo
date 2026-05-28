/**
 * PUNTO DE ENTRADA DE LA APP (UI)
 * - Monta React en index.html (#root)
 * - BrowserRouter: cambia pantallas con la URL (/inicio, /mis-proyectos, etc.)
 * - GoogleOAuthProvider: boton "Acceder con Google" en login
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css' /* estilos globales (fondo, tipografia) */
import App from './App.jsx' /* componente principal: login + menu + rutas */

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
