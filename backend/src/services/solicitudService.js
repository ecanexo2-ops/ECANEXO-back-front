const pool = require('../config/db')

// Normaliza un texto: minúsculas + sin tildes + sin caracteres raros.
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function listarSolicitudes() {
  const [rows] = await pool.query(`
    SELECT s.*, CONCAT(c.primer_nombre,' ',c.primer_apellido) AS cliente_nombre
    FROM solicitudes s
    JOIN clientes c ON s.id_cliente = c.id
    ORDER BY s.fecha_registro DESC
  `)

  const ids = rows.map((r) => r.id)
  const materialesMap = {}

  if (ids.length > 0) {
    const [mats] = await pool.query(`
      SELECT sm.id_solicitud, m.nombre
      FROM solicitud_materiales sm
      JOIN materiales m ON sm.id_material = m.id
      WHERE sm.id_solicitud IN (?)
    `, [ids])

    mats.forEach((m) => {
      if (!materialesMap[m.id_solicitud]) materialesMap[m.id_solicitud] = []
      materialesMap[m.id_solicitud].push(m.nombre)
    })
  }

  return rows.map((s) => ({
    id: s.id,
    cliente: s.cliente_nombre,
    material: (materialesMap[s.id] || []).join(', '),
    cantidadKg: s.cantidad_kg,
    estado: s.estado,
    fecha: s.fecha_entrega,
    hora: s.hora_entrega,
  }))
}

async function crearSolicitud({ cliente, material, cantidadKg, fecha, hora }) {
  // --- Validaciones de entrada ---
  const cantidad = Number(cantidadKg)
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un número mayor a 0.')
  }
  if (!cliente) throw new Error('El cliente es obligatorio.')
  if (!material || typeof material !== 'string' || !material.trim()) {
    throw new Error('Debes seleccionar al menos un material.')
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

    // --- Insertar solicitud ---
    const [result] = await conn.query(
      `INSERT INTO solicitudes (id_cliente, fecha_entrega, hora_entrega, cantidad_kg)
       VALUES (?, ?, ?, ?)`,
      [cs[0].id, fecha || null, hora || null, cantidad]
    )
    const idSol = result.insertId

    // --- Resolver materiales por nombre normalizado ---
    const nombresSolicitados = material.split(',').map((n) => n.trim()).filter(Boolean)
    if (nombresSolicitados.length === 0) {
      throw new Error('Debes seleccionar al menos un material.')
    }

    const [materiales] = await conn.query('SELECT id, nombre FROM materiales')

    for (const nom of nombresSolicitados) {
      const matEncontrado = materiales.find(
        (m) => normalizar(m.nombre) === normalizar(nom)
      )
      if (!matEncontrado) {
        throw new Error(`Material no encontrado: "${nom}".`)
      }
      await conn.query(
        'INSERT INTO solicitud_materiales (id_solicitud, id_material) VALUES (?, ?)',
        [idSol, matEncontrado.id]
      )
    }

    await conn.commit()

    return {
      id: idSol,
      cliente,
      material: nombresSolicitados.join(', '),
      cantidadKg: cantidad,
      estado: 'Pendiente',
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

module.exports = { listarSolicitudes, crearSolicitud }