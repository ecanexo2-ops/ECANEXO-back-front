import { useState } from 'react'
import logo from '../assets/logo.jpeg'
import { api } from '../services/api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async () => {
    if (!username || !password) { setError('Ingresa usuario y contraseña.'); return }
    setError(''); setLoading(true)
    try {
      const user = await api.login(username, password)
      onLogin(user)
    } catch (e) {
      setError(e.message || 'Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="ECANEXO" style={{ width: 130 }} />
        </div>
        <h2>Bienvenido a ECANEXO</h2>
        <p className="sub">Sistema de Gestión de Reciclaje</p>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>Usuario</label>
          <input type="text" placeholder="caja / planillero / admin"
            value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        <button className="btn-primary full" onClick={handleLogin} disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  )
}
