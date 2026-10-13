import { useEffect, useState } from 'react'
import { api } from '../services/api'

const badgeClass = { Pagado: 'badge-green', Pendiente: 'badge-yellow' }

export default function Pagos() {
  const [clientes, setClientes] = useState([])
  const [pagos,    setPagos]    = useState([])
  const [tarifas,  setTarifas]  = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [cliente,  setCliente]  = useState('')
  const [mat,      setMat]      = useState('')
  const [kg,       setKg]       = useState(50)
  const [msg,      setMsg]      = useState(false)
  const [error,    setError]    = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([api.getClientes(), api.getPagos(), api.getTarifas()])
      .then(([cs, ps, ts]) => {
        setClientes(cs); setPagos(ps); setTarifas(ts)
        if (cs[0]) setCliente(cs[0].nombre)
        const keys = Object.keys(ts)
        if (keys[0]) setMat(keys[0])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const precioKg = tarifas[mat]?.precioKg || 0
  const total    = (precioKg * Number(kg)).toLocaleString('es-CO')

  const confirmar = async () => {
    setError(''); setSaving(true)
    try {
      await api.crearPago({ cliente, material: mat, kg: Number(kg) })
      setMsg(true); cargar(); setTimeout(() => setMsg(false), 3000)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="section-title">Módulo de pago</div>
      <div className="section-sub">RF04 — Registro de pagos en efectivo</div>
      {msg   && <div className="success-msg">✅ Pago registrado. Comprobante generado.</div>}
      {error && <div className="login-error">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Registrar pago</div>
          <div className="form-group"><label>Cliente</label>
            <select value={cliente} onChange={e => setCliente(e.target.value)}>
              {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Material</label>
              <select value={mat} onChange={e => setMat(e.target.value)}>
                {Object.entries(tarifas).map(([key, t]) => (
                  <option key={key} value={key}>{t.nombre} — ${t.precioKg.toLocaleString('es-CO')}/kg</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Peso (kg)</label>
              <input type="number" value={kg} onChange={e => setKg(Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group"><label>Método de pago</label>
            <select><option>💵 Efectivo</option></select>
          </div>
          <div className="pago-total">
            <div><div className="pago-total-label">Total a pagar</div></div>
            <div className="pago-total-value">${total}</div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary">Cancelar</button>
            <button className="btn-primary" onClick={confirmar} disabled={saving}>
              {saving ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Historial de pagos</div>
          <div className="table-wrap"><table>
            <thead><tr><th>Recibo</th><th>Cliente</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
              {!loading && pagos.slice().reverse().map(p => (
                <tr key={p.id}>
                  <td>{p.recibo}</td>
                  <td>{p.cliente}</td>
                  <td>${p.monto.toLocaleString('es-CO')}</td>
                  <td><span className={'badge ' + (badgeClass[p.estado] || 'badge-gray')}>{p.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  )
}
