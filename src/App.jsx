import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import LoginScreen from './components/LoginScreen.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true',
  )

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoggedIn={() => setIsLoggedIn(true)} />
  }

  return <Dashboard onLogout={handleLogout} />
}

export default App
