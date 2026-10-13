const pool = require('../config/db')

async function listarTarifas() {
  const [rows] = await pool.query(
    'SELECT nombre, precio_venta, precio_compra FROM materiales'
  )

  const emojis = { Cartón: '🟫', Metales: '⚙️', Vidrio: '🫙', Cobre: '🔶', Plástico: '🧴' }
  const tarifas = {}

  rows.forEach((r) => {
    const key = r.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    tarifas[key] = {
      nombre: `${emojis[r.nombre] || ''} ${r.nombre}`,
      precioVenta: Number(r.precio_venta),
      precioCompra: Number(r.precio_compra),
      // Alias temporal para no romper el frontend actual.
      // En una fase posterior migramos a precioVenta/precioCompra.
      precioKg: Number(r.precio_venta),
    }
  })

  return tarifas
}

module.exports = { listarTarifas }