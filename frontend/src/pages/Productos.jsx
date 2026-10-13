import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Productos() {
  const [recicladores, setRecicladores] = useState([])
  const [productos,    setProductos]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [reciclador,   setReciclador]   = useState('')
  const [mat,          setMat]          = useState('')
  const [kg,           setKg]           = useState('')
  const [fecha,        setFecha]        = useState('')
  const [lote,         setLote]         = useState('')
  const [msg,          setMsg]          = useState(false)
  const [error,        setError]        = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([api.getRecicladores(), api.getProductos()])
      .then(([rs, ps]) => {
        setRecicladores(rs); setProductos(ps)
        if (rs[0]) setReciclador(rs[0].nombre)
        if (ps[0]) setMat(ps[0].material)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const registrar = async () => {
    if (!kg) { setError('Ingresa el peso recibido.'); return }
    setError(''); setSaving(true)
    try {
      await api.registrarEntradaProducto({ material: mat, kg: Number(kg), reciclador, fecha, lote })
      setMsg(true); setKg(''); setLote(''); cargar()
      setTimeout(() => setMsg(false), 3000)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const estadoStock = kg => kg < 200
    ? { label: 'Bajo stock', cls: 'badge-yellow' }
    : { label: 'Disponible', cls: 'badge-green' }

  return (
    <>
      <div className="section-title">Registrar productos</div>
      <div className="section-sub">RF07 — Clasificación de materiales y registro de inventario</div>
      {msg   && <div className="success-msg">✅ Material registrado. Inventario actualizado.</div>}
      {error && <div className="login-error">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Entrada de material</div>
          <div className="form-group"><label>Reciclador</label>
            <select value={reciclador} onChange={e => setReciclador(e.target.value)}>
              {recicladores.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Tipo de material</label>
            <div className="material-tags">
              {productos.map(p => (
                <div key={p.material} className={'material-tag' + (mat === p.material ? ' sel' : '')}
                  onClick={() => setMat(p.material)}>{p.nombre}</div>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Peso (kg)</label>
              <input type="number" placeholder="0.00" value={kg} onChange={e => setKg(e.target.value)} />
            </div>
            <div className="form-group"><label>Fecha recepción</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>
          <div className="form-group"><label>N° de lote</label>
            <input type="text" placeholder="LOT-2024-001" value={lote} onChange={e => setLote(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={registrar} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar entrada'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Inventario</div>
          <div className="table-wrap"><table>
            <thead><tr><th>Material</th><th>Stock</th><th>Precio/kg</th><th>Estado</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
              {!loading && productos.map(p => {
                const est = estadoStock(p.stockKg)
                return (
                  <tr key={p.material}>
                    <td>{p.nombre}</td>
                    <td>{p.stockKg} kg</td>
                    <td>${p.precioKg.toLocaleString('es-CO')}</td>
                    <td><span className={'badge ' + est.cls}>{est.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  )
}
