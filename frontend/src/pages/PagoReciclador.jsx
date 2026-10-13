import { useEffect, useState } from 'react'
import { api } from '../services/api'

const badgeClass = { Pagado: 'badge-green', Pendiente: 'badge-yellow' }

export default function PagoReciclador() {
  const [recicladores, setRecicladores] = useState([])
  const [pagos,        setPagos]        = useState([])
  const [tarifas,      setTarifas]      = useState({})
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [reciclador,   setReciclador]   = useState('')
  const [mat,          setMat]          = useState('')
  const [kg,           setKg]           = useState(80)
  const [bonus,        setBonus]        = useState(0)
  const [modalidad,    setModalidad]    = useState('Efectivo')
  const [msg,          setMsg]          = useState(false)
  const [error,        setError]        = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([api.getRecicladores(), api.getPagosReciclador(), api.getTarifas()])
      .then(([rs, ps, ts]) => {
        setRecicladores(rs); setPagos(ps); setTarifas(ts)
        if (rs[0]) setReciclador(rs[0].nombre)
        const keys = Object.keys(ts)
        if (keys[0]) setMat(keys[0])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  // Usamos precioCompra: es lo que ECA le paga al reciclador.
  // El backend también usa precio_compra, así los montos coinciden.
  const precioKg = tarifas[mat]?.precioCompra || 0
  const base     = precioKg * Number(kg)
  const total    = Math.round(base * (1 + Number(bonus) / 100)).toLocaleString('es-CO')

  const procesar = async () => {
    setError(''); setSaving(true)
    try {
      await api.crearPagoReciclador({ reciclador, material: mat, kg: Number(kg), bonus: Number(bonus), modalidad })
      setMsg(true); cargar(); setTimeout(() => setMsg(false), 3000)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="section-title">Pago al reciclador</div>
      <div className="section-sub">RF08 — Gestión y procesamiento de pagos a recicladores</div>
      {msg   && <div className="success-msg">✅ Pago procesado. Recibo generado.</div>}
      {error && <div className="login-error">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Procesar pago</div>
          <div className="form-group"><label>Reciclador</label>
            <select value={reciclador} onChange={e => setReciclador(e.target.value)}>
              {recicladores.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Material</label>
              <select value={mat} onChange={e => setMat(e.target.value)}>
                {Object.entries(tarifas).map(([key, t]) => (
                  <option key={key} value={key}>{t.nombre} — ${t.precioCompra.toLocaleString('es-CO')}/kg</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Peso (kg)</label>
              <input type="number" value={kg} onChange={e => setKg(Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group"><label>Bonificación por calidad (%)</label>
            <input type="number" value={bonus} min={0} max={20} onChange={e => setBonus(Number(e.target.value))} />
          </div>
          <div className="form-group"><label>Modalidad</label>
            <select value={modalidad} onChange={e => setModalidad(e.target.value)}>
              <option>Efectivo</option>
              <option>Transferencia bancaria</option>
            </select>
          </div>
          <div className="pago-total">
            <div>
              <div className="pago-total-label">Monto a pagar</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                {kg} kg × ${precioKg.toLocaleString('es-CO')} + {bonus}% bonif.
              </div>
            </div>
            <div className="pago-total-value">${total}</div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary">Cancelar</button>
            <button className="btn-primary" onClick={procesar} disabled={saving}>
              {saving ? 'Procesando...' : 'Procesar pago'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Reporte de pagos</div>
          <div className="table-wrap"><table>
            <thead><tr><th>Reciclador</th><th>Material</th><th>Kg</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5}>Cargando...</td></tr>}
              {!loading && pagos.slice().reverse().map(p => (
                <tr key={p.id}>
                  <td>{p.reciclador}</td>
                  <td>{tarifas[p.material]?.nombre || p.material}</td>
                  <td>{p.kg}</td>
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