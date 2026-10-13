import { useEffect, useState } from 'react'
import { api } from '../services/api'

const MATS = ['🟫 Cartón','⚙️ Metales','🫙 Vidrio','🔶 Cobre','🧴 Plástico']
const badgeClass = { Confirmada: 'badge-green', Pendiente: 'badge-yellow', 'En proceso': 'badge-blue' }

export default function Solicitudes() {
  const [clientes,    setClientes]    = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [sel,         setSel]         = useState([])
  const [cliente,     setCliente]     = useState('')
  const [fecha,       setFecha]       = useState('')
  const [hora,        setHora]        = useState('')
  const [cantidad,    setCantidad]    = useState('')
  const [msg,         setMsg]         = useState(false)
  const [error,       setError]       = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([api.getClientes(), api.getSolicitudes()])
      .then(([cs, ss]) => { setClientes(cs); setSolicitudes(ss); if (cs[0]) setCliente(cs[0].nombre) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const toggle = m => setSel(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const guardar = async () => {
    if (!cliente || sel.length === 0 || !cantidad) { setError('Selecciona cliente, material y cantidad.'); return }
    setError(''); setSaving(true)
    try {
      await api.crearSolicitud({
        cliente, cantidadKg: Number(cantidad), fecha, hora,
        material: sel.map(m => m.replace(/^\S+\s/, '')).join(', '),
      })
      setMsg(true); setSel([]); setCantidad(''); cargar()
      setTimeout(() => setMsg(false), 3000)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="section-title">Solicitud de producto</div>
      <div className="section-sub">RF03 — Registro de pedidos por tipo de material</div>
      {msg   && <div className="success-msg">✅ Solicitud registrada correctamente.</div>}
      {error && <div className="login-error">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Nueva solicitud</div>
          <div className="form-group"><label>Cliente</label>
            <select value={cliente} onChange={e => setCliente(e.target.value)}>
              {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Fecha de entrega</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="form-group"><label>Hora de entrega</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>
          <div className="form-group"><label>Materiales</label>
            <div className="material-tags">
              {MATS.map(m => (
                <div key={m} className={'material-tag' + (sel.includes(m) ? ' sel' : '')} onClick={() => toggle(m)}>{m}</div>
              ))}
            </div>
          </div>
          <div className="form-group"><label>Cantidad (kg)</label>
            <input type="number" placeholder="50" value={cantidad} onChange={e => setCantidad(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar solicitud'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Historial</div>
          <div className="table-wrap"><table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Material</th><th>Estado</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
              {!loading && solicitudes.slice().reverse().map(s => (
                <tr key={s.id}>
                  <td>#{String(s.id).padStart(4,'0')}</td>
                  <td>{s.cliente}</td>
                  <td>{s.material}</td>
                  <td><span className={'badge ' + (badgeClass[s.estado] || 'badge-gray')}>{s.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  )
}
