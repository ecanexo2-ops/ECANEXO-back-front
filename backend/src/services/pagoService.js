const pool = require('../config/db')

// Normaliza un texto: minúsculas + sin tildes + sin caracteres raros.
// "Cartón" → "carton"   /   "PLÁSTICO" → "plastico"
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function listarPagos() {
  const [rows] = await pool.query(`
    SELECT p.*, CONCAT(c.primer_nombre,' ',c.primer_apellido) AS cliente_nombre,
           m.nombre AS material_nombre
    FROM pagos p
    JOIN clientes c   ON p.id_cliente  = c.id
    JOIN materiales m ON p.id_material = m.id
    ORDER BY p.fecha DESC
  `)

  return rows.map((p) => ({
    id: p.id,
    recibo: `#R${String(p.id).padStart(3, '0')}`,
    cliente: p.cliente_nombre,
    material: p.material_nombre,
    monto: Number(p.total),
    estado: p.estado,
  }))
}

async function crearPago({ cliente, material, kg }) {
  // --- Validación de entrada ---
  const peso = Number(kg)
  if (!Number.isFinite(peso) || peso <= 0) {
    throw new Error('El peso debe ser un número mayor a 0.')
  }
  if (!cliente || !material) {
    throw new Error('Cliente y material son obligatorios.')
  }

  // --- Buscar cliente ---
  const [cs] = await pool.query(
    'SELECT id FROM clientes WHERE CONCAT(primer_nombre," ",primer_apellido) = ?',
    [cliente]
  )
  if (cs.length === 0) throw new Error('Cliente no encontrado.')

  // --- Buscar material normalizado (aquí está el fix) ---
  const [materiales] = await pool.query(
    'SELECT id, nombre, precio_venta FROM materiales'
  )
  const matEncontrado = materiales.find(
    (m) => normalizar(m.nombre) === normalizar(material)
  )
  if (!matEncontrado) throw new Error('Material no encontrado.')

  // --- Calcular total ---
  const precioKg = Number(matEncontrado.precio_venta)
  const total = precioKg * peso

  // --- Insertar pago ---
  const [result] = await pool.query(
    `INSERT INTO pagos (id_cliente, id_material, peso_kg, precio_kg, total, metodo_pago)
     VALUES (?, ?, ?, ?, ?, 'Efectivo')`,
    [cs[0].id, matEncontrado.id, peso, precioKg, total]
  )

  return { id: result.insertId, monto: total, estado: 'Pagado' }
}

module.exports = { listarPagos, crearPago }