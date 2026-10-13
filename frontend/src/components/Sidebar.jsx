import { NavLink, useNavigate } from 'react-router-dom'

export default function Sidebar({ user, onLogout }) {
  const navigate     = useNavigate()
  const esCaja       = user.role === 'Caja'       || user.role === 'Admin'
  const esPlanillero = user.role === 'Planillero'  || user.role === 'Admin'

  const handleLogout = () => { onLogout(); navigate('/') }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">ECA</div>
          <span className="sidebar-logo-text">ECANEXO</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user.initials}</div>
        <div className="user-info">
          <div className="name">{user.username}</div>
          <div className="role">{user.role}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">General</div>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          📊 Dashboard
        </NavLink>

        {esCaja && <>
          <div className="nav-section">Módulos Caja</div>
          <NavLink to="/clientes"    className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>👤 Clientes</NavLink>
          <NavLink to="/solicitudes" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>📄 Solicitudes</NavLink>
          <NavLink to="/pagos"       className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>💳 Módulo de pago</NavLink>
          <NavLink to="/ventas"      className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>📈 Ventas</NavLink>
        </>}

        {esPlanillero && <>
          <div className="nav-section">Módulos Planillero</div>
          <NavLink to="/planillero"      className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>♻️ Recicladores</NavLink>
          <NavLink to="/productos"       className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>📦 Registrar productos</NavLink>
          <NavLink to="/pago-reciclador" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>💵 Pago Reciclador</NavLink>
        </>}

        {user.role === 'Admin' && <>
          <div className="nav-section">Administración</div>
          <NavLink to="/usuarios" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>🔐 Usuarios</NavLink>
        </>}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  )
}
