const pool = require('../config/db')
const { validarSoloLetras, validarSoloNumeros, validarSoloNumerosOpcional } = require('../utils/validators')

async function listarClientes(q) {
  let sql = 'SELECT * FROM clientes'
  const params = []

  if (q) {
    sql += ' WHERE primer_nombre LIKE ? OR primer_apellido LIKE ? OR numero_documento LIKE ?'
    const like = `%${q}%`
    params.push(like, like, like)
  }

  const [rows] = await pool.query(sql, params)

  return rows.map((c) => ({
    id: c.id,
    nombre: `${c.primer_nombre} ${c.primer_apellido}`.trim(),
    documento: `${c.tipo_documento.includes('NIT') ? 'NIT' : 'CC'} ${c.numero_documento}`,
    tipo: c.tipo_cliente,
    email: c.email,
    telefono: c.telefono,
  }))
}

async function crearCliente({ nombre, documento, tipo, email, telefono }) {
  const partes = (nombre || '').split(' ')
  const primerNom = partes[0]
  const primerApe = partes.slice(1).join(' ') || ''

  const errNom = validarSoloLetras(primerNom, 'El nombre')
  if (errNom) throw new Error(errNom)
  if (primerApe) {
    const errApe = validarSoloLetras(primerApe, 'El apellido')
    if (errApe) throw new Error(errApe)
  }

  const docPartes = documento.split(' ')
  const tipoDoc = docPartes[0] === 'NIT' ? 'NIT' : 'Cédula (CC)'
  const numDoc = docPartes.slice(1).join('')

  const errDoc = validarSoloNumeros(numDoc, 'El número de documento')
  if (errDoc) throw new Error(errDoc)

  const errTel = validarSoloNumerosOpcional(telefono, 'El teléfono')
  if (errTel) throw new Error(errTel)

  const [result] = await pool.query(
    `INSERT INTO clientes
     (tipo_documento, numero_documento, primer_nombre, primer_apellido, email, telefono, tipo_cliente)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tipoDoc, numDoc, primerNom, primerApe, email || '', telefono || '', tipo || 'Externo']
  )

  return { id: result.insertId, nombre, documento, tipo, email, telefono }
}

async function actualizarCliente(id, { nombre, tipo, email, telefono }) {
  const partes = (nombre || '').split(' ')
  const primerNom = partes[0]
  const primerApe = partes.slice(1).join(' ') || ''

  const errNom = validarSoloLetras(primerNom, 'El nombre')
  if (errNom) throw new Error(errNom)
  if (primerApe) {
    const errApe = validarSoloLetras(primerApe, 'El apellido')
    if (errApe) throw new Error(errApe)
  }

  const errTel = validarSoloNumerosOpcional(telefono, 'El teléfono')
  if (errTel) throw new Error(errTel)

  await pool.query(
    'UPDATE clientes SET primer_nombre=?, primer_apellido=?, tipo_cliente=?, email=?, telefono=? WHERE id=?',
    [primerNom, primerApe, tipo, email, telefono, id]
  )

  return { id: Number(id), nombre, tipo, email, telefono }
}

async function eliminarCliente(id) {
  const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id])

  if (result.affectedRows === 0) {
    const error = new Error('Cliente no encontrado.')
    error.statusCode = 404
    throw error
  }

  return { mensaje: 'Cliente eliminado correctamente.' }
}

module.exports = { listarClientes, crearCliente, actualizarCliente, eliminarCliente }