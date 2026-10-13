
const pool = require('../config/db')

// Normaliza un texto: minúsculas + sin tildes + sin caracteres raros.
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function listarPagosReciclador() {
  const [rows] = await pool.query(`
    SELECT pr.*, CONCAT(r.primer_nombre,' ',r.primer_apellido) AS reciclador_nombre,
           m.nombre AS material_nombre
    FROM pagos_reciclador pr
    JOIN recicladores r ON pr.id_reciclador = r.id
    JOIN materiales m   ON pr.id_material   = m.id
    ORDER BY pr.fecha DESC
  `)

  return rows.map((p) => ({
    id: p.id,
    reciclador: p.reciclador_nombre,
    material: p.material_nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    kg: Number(p.peso_kg),
    monto: Number(p.total),
    estado: p.estado,
  }))
}

async function crearPagoReciclador({ reciclador, material, kg, bonus = 0, modalidad }) {
  // --- Validaciones de entrada ---
  const peso = Number(kg)
  const bonificacion = Number(bonus)
  if (!Number.isFinite(peso) || peso <= 0) {
    throw new Error('El peso debe ser un número mayor a 0.')
  }
  if (!Number.isFinite(bonificacion) || bonificacion < 0 || bonificacion > 100) {
    throw new Error('La bonificación debe estar entre 0 y 100.')
  }
  if (!reciclador || !material) {
    throw new Error('Reciclador y material son obligatorios.')
  }

  // --- Buscar reciclador ---
  const [rs] = await pool.query(
    'SELECT id FROM recicladores WHERE CONCAT(primer_nombre," ",primer_apellido) = ?',
    [reciclador]
  )
  if (rs.length === 0) throw new Error('Reciclador no encontrado.')

  // --- Buscar material normalizado ---
  const [materiales] = await pool.query(
    'SELECT id, nombre, precio_compra FROM materiales'
  )
  const matEncontrado = materiales.find(
    (m) => normalizar(m.nombre) === normalizar(material)
  )
  if (!matEncontrado) throw new Error('Material no encontrado.')

  // --- Calcular total con precio de COMPRA (lo que ECA paga al reciclador) ---
  const precioKg = Number(matEncontrado.precio_compra)
  const montoBase = precioKg * peso
  const total = Math.round(montoBase * (1 + bonificacion / 100))

  // --- Insertar pago ---
  const [result] = await pool.query(
    `INSERT INTO pagos_reciclador
     (id_reciclador, id_material, peso_kg, precio_kg, monto_base, bonificacion_pct, total, modalidad_pago)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      rs[0].id,
      matEncontrado.id,
      peso,
      precioKg,
      montoBase,
      bonificacion,
      total,
      modalidad || 'Efectivo',
    ]
  )

  return { id: result.insertId, monto: total, estado: 'Pagado' }
}

module.exports = { listarPagosReciclador, crearPagoReciclador }