import { useEffect, useState } from 'react'
import { api } from '../services/api'

const badgeClass = { Confirmada: 'badge-green', Pendiente: 'badge-yellow', 'En proceso': 'badge-blue' }

export default function Dashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="section-sub">Cargando panel...</div>
  if (error)   return <div className="login-error">{error}</div>
  if (!data)   return null

  return (
    <>
      <div className="section-title">Panel de control</div>
      <div className="section-sub">Resumen general del sistema ECA</div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Clientes registrados</div><div className="stat-value green">{data.clientesRegistrados}</div></div>
        <div className="stat-card"><div className="stat-label">Recicladores activos</div><div className="stat-value blue">{data.recicladoresActivos}</div></div>
        <div className="stat-card"><div className="stat-label">Ventas del mes</div><div className="stat-value">${data.ventasMes.toLocaleString('es-CO')}</div><div className="stat-sub">COP</div></div>
        <div className="stat-card"><div className="stat-label">Inventario total</div><div className="stat-value green">{data.inventarioTotalKg.toLocaleString('es-CO')} kg</div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Últimas solicitudes</div>
          <div className="table-wrap"><table>
            <thead><tr><th>Cliente</th><th>Material</th><th>Estado</th></tr></thead>
            <tbody>
              {data.ultimasSolicitudes.map(s => (
                <tr key={s.id}>
                  <td>{s.cliente}</td>
                  <td>{s.material}</td>
                  <td><span className={'badge ' + (badgeClass[s.estado] || 'badge-gray')}>{s.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <div className="card">
          <div className="card-title">Inventario actual</div>
          <div className="table-wrap"><table>
            <thead><tr><th>Material</th><th>Cantidad</th><th>Precio/kg</th></tr></thead>
            <tbody>
              {data.inventario.map(p => (
                <tr key={p.material}>
                  <td>{p.nombre}</td>
                  <td>{p.stockKg} kg</td>
                  <td>${p.precioKg.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  )
}
