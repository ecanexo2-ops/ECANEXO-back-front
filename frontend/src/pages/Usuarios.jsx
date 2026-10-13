import { useEffect, useState } from 'react'
import { api } from '../services/api'

const badgeClass = { Admin: 'badge-blue', Caja: 'badge-green', Planillero: 'badge-gray' }
const emptyForm  = { usuario: '', password: '', confirmarPassword: '', rol: 'Caja' }

// El nombre de usuario solo admite letras, números, puntos y guion bajo (sin espacios)
const soloUsuario = (valor) => valor.replace(/[^A-Za-z0-9._]/g, '')

export default function Usuarios() {
  const [usuarios,   setUsuarios]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')
  const [form,       setForm]       = useState(emptyForm)
  const [confirmId,  setConfirmId]  = useState(null)

  const cargar = () => {
    setLoading(true)
    api.getUsuarios().then(setUsuarios).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const update       = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const updateUsuario = e => setForm(f => ({ ...f, usuario: soloUsuario(e.target.value) }))

  const registrar = async () => {
    if (!form.usuario || !form.password) { setError('Usuario y contraseña son obligatorios.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (form.password !== form.confirmarPassword) { setError('Las contraseñas no coinciden.'); return }
    setError(''); setSaving(true)
    try {
      await api.crearUsuario({
        usuario:           form.usuario,
        password:          form.password,
        confirmarPassword: form.confirmarPassword,
        rol:               form.rol,
      })
      setMsg('✅ Usuario creado correctamente.')
      setForm(emptyForm); cargar()
      setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    try {
      await api.eliminarUsuario(id)
      setMsg('🗑️ Usuario eliminado correctamente.')
      setConfirmId(null); cargar()
      setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message); setConfirmId(null) }
  }

  return (
    <>
      <div className="section-title">Gestión de usuarios</div>
      <div className="section-sub">Solo el administrador puede crear y eliminar usuarios del sistema</div>
      {msg   && <div className="success-msg">{msg}</div>}
      {error && <div className="login-error">{error}</div>}

      <div className="grid-2">
        {/* FORMULARIO */}
        <div className="card">
          <div className="card-title">➕ Crear usuario</div>
          <div className="form-group"><label>Usuario</label>
            <input type="text" placeholder="pedro.gomez" value={form.usuario} onChange={updateUsuario}
              title="Solo letras, números, puntos y guion bajo" />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Contraseña</label>
              <input type="password" placeholder="mínimo 6 caracteres" value={form.password} onChange={update('password')} />
            </div>
            <div className="form-group"><label>Confirmar contraseña</label>
              <input type="password" placeholder="repite la contraseña" value={form.confirmarPassword} onChange={update('confirmarPassword')} />
            </div>
          </div>
          <div className="form-group"><label>Rol</label>
            <select value={form.rol} onChange={update('rol')}>
              <option>Caja</option>
              <option>Planillero</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setForm(emptyForm); setError('') }}>Limpiar</button>
            <button className="btn-primary" onClick={registrar} disabled={saving}>
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="card">
          <div className="card-title">Usuarios registrados ({usuarios.length})</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
                {!loading && usuarios.length === 0 && <tr><td colSpan={4}>Sin usuarios registrados.</td></tr>}
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.usuario}</td>
                    <td><span className={'badge ' + (badgeClass[u.rol] || 'badge-gray')}>{u.rol}</span></td>
                    <td>
                      <span className={'badge ' + (u.estado === 'Activo' ? 'badge-green' : 'badge-gray')}>
                        {u.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {confirmId === u.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#e53e3e' }}>¿Seguro?</span>
                            <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                              onClick={() => eliminar(u.id)}>Sí</button>
                            <button className="btn-sm" onClick={() => setConfirmId(null)}>No</button>
                          </div>
                        ) : (
                          <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                            onClick={() => { setConfirmId(u.id); setError('') }}>
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
