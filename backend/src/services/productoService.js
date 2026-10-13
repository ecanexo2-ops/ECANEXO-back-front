const pool = require('../config/db')

// Normaliza un texto: minúsculas + sin tildes + sin caracteres raros.
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function listarProductos() {
  const [rows] = await pool.query(`
    SELECT m.nombre, m.precio_venta, i.cantidad_kg
    FROM materiales m
    JOIN inventario i ON i.id_material = m.id
  `)

  const emojis = { Cartón: '🟫', Metales: '⚙️', Vidrio: '🫙', Cobre: '🔶', Plástico: '🧴' }

  return rows.map((r) => ({
    material: r.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    nombre: `${emojis[r.nombre] || ''} ${r.nombre}`,
    stockKg: Number(r.cantidad_kg),
    precioKg: Number(r.precio_venta),
  }))
}

async function registrarEntradaProducto({ material, kg, reciclador, fecha, lote }) {
  // --- Validaciones de entrada ---
  const peso = Number(kg)
  if (!Number.isFinite(peso) || peso <= 0) {
    throw new Error('El peso debe ser un número mayor a 0.')
  }
  if (!material || !reciclador) {
    throw new Error('Material y reciclador son obligatorios.')
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // --- Buscar material normalizado ---
    const [materiales] = await conn.query(
      'SELECT id, nombre FROM materiales'
    )
    const matEncontrado = materiales.find(
      (m) => normalizar(m.nombre) === normalizar(material)
    )
    if (!matEncontrado) throw new Error('Material no encontrado.')

    // --- Buscar reciclador ---
    const [rs] = await conn.query(
      'SELECT id FROM recicladores WHERE CONCAT(primer_nombre," ",primer_apellido) = ?',
      [reciclador]
    )
    if (rs.length === 0) throw new Error('Reciclador no encontrado.')

    // --- Insertar recepción ---
    await conn.query(
      `INSERT INTO recepciones (id_reciclador, id_material, peso_kg, numero_lote, fecha)
       VALUES (?, ?, ?, ?, ?)`,
      [
        rs[0].id,
        matEncontrado.id,
        peso,
        lote || null,
        fecha || new Date().toISOString().split('T')[0],
      ]
    )

    // --- Upsert en inventario: si no existe la fila, la crea; si existe, suma ---
    await conn.query(
      `INSERT INTO inventario (id_material, cantidad_kg)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cantidad_kg = cantidad_kg + VALUES(cantidad_kg)`,
      [matEncontrado.id, peso]
    )

    // --- Leer stock final ---
    const [inv] = await conn.query(
      'SELECT cantidad_kg FROM inventario WHERE id_material = ?',
      [matEncontrado.id]
    )

    await conn.commit()

    return {
      material: matEncontrado.nombre,
      stockKg: Number(inv[0].cantidad_kg),
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

module.exports = { listarProductos, registrarEntradaProducto }