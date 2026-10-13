const pool = require('../config/db')

// Normaliza un texto: minúsculas + sin tildes + sin caracteres raros.
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function listarVentas() {
  const [rows] = await pool.query(`
    SELECT v.*, CONCAT(c.primer_nombre,' ',c.primer_apellido) AS cliente_nombre,
           m.nombre AS material_nombre
    FROM ventas v
    JOIN clientes c   ON v.id_cliente  = c.id
    JOIN materiales m ON v.id_material = m.id
    ORDER BY v.fecha DESC
  `)

  return rows.map((v) => ({
    id: v.id,
    ticket: `T-${String(v.id).padStart(3, '0')}`,
    cliente: v.cliente_nombre,
    material: v.material_nombre,
    kg: Number(v.cantidad_kg),
    precioKg: Number(v.precio_kg),
    total: Number(v.total),
  }))
}

async function crearVenta({ cliente, material, kg, precioKg, solicitudId }) {
  // --- Validaciones de entrada ---
  const peso = Number(kg)
  const precio = Number(precioKg)
  if (!Number.isFinite(peso) || peso <= 0) {
    throw new Error('La cantidad debe ser un número mayor a 0.')
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error('El precio debe ser un número mayor a 0.')
  }
  if (!cliente || !material) {
    throw new Error('Cliente y material son obligatorios.')
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // --- Buscar cliente ---
    const [cs] = await conn.query(
      'SELECT id FROM clientes WHERE CONCAT(primer_nombre," ",primer_apellido) = ?',
      [cliente]
    )
    if (cs.length === 0) throw new Error('Cliente no encontrado.')

    // --- Buscar material normalizado ---
    const [materiales] = await conn.query(
      'SELECT id, nombre FROM materiales'
    )
    const matEncontrado = materiales.find(
      (m) => normalizar(m.nombre) === normalizar(material)
    )
    if (!matEncontrado) throw new Error('Material no encontrado.')

    // --- Bloquear y verificar stock ---
    const [invRows] = await conn.query(
      'SELECT cantidad_kg FROM inventario WHERE id_material = ? FOR UPDATE',
      [matEncontrado.id]
    )
    if (invRows.length === 0) {
      throw new Error('El material no tiene registro en inventario.')
    }
    const stockActual = Number(invRows[0].cantidad_kg)
    if (stockActual < peso) {
      throw new Error(`Stock insuficiente. Disponible: ${stockActual} kg, solicitado: ${peso} kg.`)
    }

    // --- Insertar venta ---
    const total = peso * precio
    const [result] = await conn.query(
      `INSERT INTO ventas (id_cliente, id_material, id_solicitud, cantidad_kg, precio_kg, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cs[0].id, matEncontrado.id, solicitudId || null, peso, precio, total]
    )

    // --- Descontar inventario (ya validado, así que no hace falta GREATEST) ---
    await conn.query(
      'UPDATE inventario SET cantidad_kg = cantidad_kg - ? WHERE id_material = ?',
      [peso, matEncontrado.id]
    )

    // --- Marcar solicitud como confirmada ---
    if (solicitudId) {
      await conn.query(
        'UPDATE solicitudes SET estado = "Confirmada" WHERE id = ?',
        [solicitudId]
      )
    }

    await conn.commit()

    return {
      id: result.insertId,
      ticket: `T-${String(result.insertId).padStart(3, '0')}`,
      cliente,
      material: matEncontrado.nombre,
      kg: peso,
      precioKg: precio,
      total,
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

module.exports = { listarVentas, crearVenta }