const pool = require('../config/db')

async function getDashboard() {
  // Ejecutamos las consultas en paralelo para que el dashboard cargue más rápido.
  const [
    [clientesRows],
    [recicladoresRows],
    [ventasRows],
    [inventarioKgRows],
    [ultimasSolicitudes],
    [inventario],
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM clientes WHERE estado = "Activo"'),
    pool.query('SELECT COUNT(*) AS total FROM recicladores WHERE estado = "Activo"'),
    pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total FROM ventas
      WHERE MONTH(fecha) = MONTH(NOW()) AND YEAR(fecha) = YEAR(NOW())
    `),
    pool.query('SELECT COALESCE(SUM(cantidad_kg), 0) AS total FROM inventario'),
    pool.query(`
      SELECT s.id, CONCAT(c.primer_nombre,' ',c.primer_apellido) AS cliente,
             GROUP_CONCAT(m.nombre SEPARATOR ', ') AS material,
             s.estado, s.fecha_registro
      FROM solicitudes s
      JOIN clientes c ON s.id_cliente = c.id
      LEFT JOIN solicitud_materiales sm ON sm.id_solicitud = s.id
      LEFT JOIN materiales m ON m.id = sm.id_material
      GROUP BY s.id, s.estado, s.fecha_registro
      ORDER BY s.fecha_registro DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT m.nombre, i.cantidad_kg, m.precio_venta
      FROM materiales m
      JOIN inventario i ON i.id_material = m.id
    `),
  ])

  const clientes = clientesRows[0].total
  const recicladores = recicladoresRows[0].total
  const ventasMes = ventasRows[0].total
  const inventarioKg = inventarioKgRows[0].total

  const emojis = { Cartón: '🟫', Metales: '⚙️', Vidrio: '🫙', Cobre: '🔶', Plástico: '🧴' }

  return {
    clientesRegistrados: Number(clientes),
    recicladoresActivos: Number(recicladores),
    ventasMes: Number(ventasMes),
    inventarioTotalKg: Number(inventarioKg),
    ultimasSolicitudes,
    inventario: inventario.map((i) => ({
      material: i.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      nombre: `${emojis[i.nombre] || ''} ${i.nombre}`,
      stockKg: Number(i.cantidad_kg),
      precioKg: Number(i.precio_venta),
    })),
  }
}

module.exports = { getDashboard }