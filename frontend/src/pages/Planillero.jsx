import { useEffect, useState } from 'react'
import { api } from '../services/api'

const emptyForm = { tipoDoc: 'Cédula (CC)', documento: '', nombre: '', apellido: '', telefono: '', usuario: '' }

// Solo letras (con tildes/ñ) y espacios; descarta números y símbolos mientras se escribe
const soloLetras  = (valor) => valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '')
// Solo dígitos; descarta letras y símbolos mientras se escribe
const soloNumeros = (valor) => valor.replace(/[^0-9]/g, '')

export default function Planillero() {
  const [recicladores, setRecicladores] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState('')
  const [error,        setError]        = useState('')
  const [form,         setForm]         = useState(emptyForm)
  const [confirmId,    setConfirmId]    = useState(null) // ID a confirmar eliminación

  const cargar = () => {
    setLoading(true)
    api.getRecicladores().then(setRecicladores).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const update = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  // Igual que update, pero descarta cualquier carácter que no sea letra (para nombre/apellido)
  const updateLetras  = field => e => setForm(f => ({ ...f, [field]: soloLetras(e.target.value) }))
  // Igual que update, pero descarta cualquier carácter que no sea dígito (para el N° de documento)
  const updateNumeros = field => e => setForm(f => ({ ...f, [field]: soloNumeros(e.target.value) }))

  const registrar = async () => {
    if (!form.documento || !form.nombre) { setError('Documento y nombre son obligatorios.'); return }
    setError(''); setSaving(true)
    try {
      await api.crearReciclador({
        nombre:    `${form.nombre} ${form.apellido}`.trim(),
        documento: `CC ${form.documento}`,
        telefono:  form.telefono,
        usuario:   form.usuario,
      })
      setMsg('✅ Reciclador registrado en la base de datos.')
      setForm(emptyForm); cargar()
      setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    try {
      await api.eliminarReciclador(id)
      setMsg('🗑️ Reciclador eliminado correctamente.')
      setConfirmId(null); cargar()
      setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message); setConfirmId(null) }
  }

  return (
    <>
      <div className="section-title">Registro de recicladores</div>
      <div className="section-sub">RF06 — Planillero: registrar y gestionar recicladores</div>
      {msg   && <div className="success-msg">{msg}</div>}
      {error && <div className="login-error">{error}</div>}

      <div className="grid-2">
        {/* FORMULARIO */}
        <div className="card">
          <div className="card-title">➕ Registrar reciclador</div>
          <div className="form-row">
            <div className="form-group"><label>Tipo documento</label>
              <select value={form.tipoDoc} onChange={update('tipoDoc')}>
                <option>Cédula (CC)</option><option>Pasaporte</option>
              </select>
            </div>
            <div className="form-group"><label>N° documento</label>
              <input type="text" placeholder="1000999888" value={form.documento}
                onChange={updateNumeros('documento')} inputMode="numeric" pattern="[0-9]*" title="Solo números" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Primer nombre</label>
              <input type="text" placeholder="Pedro" value={form.nombre} onChange={updateLetras('nombre')}
                inputMode="text" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+" title="Solo letras" />
            </div>
            <div className="form-group"><label>Primer apellido</label>
              <input type="text" placeholder="Gómez" value={form.apellido} onChange={updateLetras('apellido')}
                inputMode="text" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+" title="Solo letras" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Teléfono</label>
              <input type="text" placeholder="315 000 1111" value={form.telefono}
                onChange={updateNumeros('telefono')} inputMode="numeric" pattern="[0-9]*" title="Solo números" />
            </div>
            <div className="form-group"><label>Usuario sistema</label>
              <input type="text" placeholder="pedro.gomez" value={form.usuario} onChange={update('usuario')} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setForm(emptyForm); setError('') }}>Limpiar</button>
            <button className="btn-primary" onClick={registrar} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar reciclador'}
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="card">
          <div className="card-title">Recicladores registrados ({recicladores.length})</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Documento</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
                {!loading && recicladores.length === 0 && <tr><td colSpan={4}>Sin recicladores registrados.</td></tr>}
                {recicladores.map(r => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td>{r.documento}</td>
                    <td>
                      <span className={'badge ' + (r.estado === 'Activo' ? 'badge-green' : 'badge-gray')}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Botón eliminar o confirmación */}
                        {confirmId === r.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#e53e3e' }}>¿Seguro?</span>
                            <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                              onClick={() => eliminar(r.id)}>Sí</button>
                            <button className="btn-sm" onClick={() => setConfirmId(null)}>No</button>
                          </div>
                        ) : (
                          <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                            onClick={() => { setConfirmId(r.id); setError('') }}>
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
