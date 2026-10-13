import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from './services/api'
import Login          from './pages/Login'
import Sidebar        from './components/Sidebar'
import Dashboard      from './pages/Dashboard'
import Clientes       from './pages/Clientes'
import Solicitudes    from './pages/Solicitudes'
import Pagos          from './pages/Pagos'
import Ventas         from './pages/Ventas'
import Planillero     from './pages/Planillero'
import Productos      from './pages/Productos'
import PagoReciclador from './pages/PagoReciclador'
import Usuarios       from './pages/Usuarios'

export default function App() {
  const [user, setUser]       = useState(null)
  const [checking, setChecking] = useState(true)

  // Al montar, intentamos recuperar la sesión desde la cookie httpOnly.
  // Si la cookie sigue viva, /auth/me devuelve { username, role }.
  // Si no, redirige al login silenciosamente.
  useEffect(() => {
    api.me()
      .then((data) => {
        // /auth/me solo devuelve username y role; reconstruimos initials.
        setUser({
          username: data.username,
          role:     data.role,
          initials: data.username.slice(0, 2).toUpperCase(),
        })
      })
      .catch(() => { /* no hay sesión, se muestra Login */ })
      .finally(() => setChecking(false))
  }, [])

  // Si el API responde 401 en cualquier request, cerramos sesión.
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

  const handleLogin = (userData) => setUser(userData)

  const handleLogout = async () => {
    try { await api.logout() } catch { /* aunque falle, cerramos sesión localmente */ }
    setUser(null)
  }

  // Mientras verificamos la cookie, mostramos un mensaje breve.
  if (checking) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h2>Cargando…</h2>
          <p className="sub">Verificando sesión</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">ECANEXO</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge-notif">Sistema activo</span>
            <span style={{ fontSize: 13, color: '#888' }}>
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'short',
                day:     '2-digit',
                month:   'short',
              })}
            </span>
          </div>
        </div>
        <div className="content">
          <Routes>
            <Route path="/"                element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard"       element={<Dashboard />} />
            <Route path="/clientes"        element={<Clientes />} />
            <Route path="/solicitudes"     element={<Solicitudes />} />
            <Route path="/pagos"           element={<Pagos />} />
            <Route path="/ventas"          element={<Ventas />} />
            <Route path="/planillero"      element={<Planillero />} />
            <Route path="/productos"       element={<Productos />} />
            <Route path="/pago-reciclador" element={<PagoReciclador />} />
            <Route path="/usuarios"        element={user.role === 'Admin' ? <Usuarios /> : <Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}