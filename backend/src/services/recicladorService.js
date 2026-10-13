const pool = require('../config/db')
const { validarSoloLetras, validarSoloNumeros, validarSoloNumerosOpcional } = require('../utils/validators')

async function listarRecicladores() {
  const [rows] = await pool.query('SELECT * FROM recicladores')

  return rows.map((r) => ({
    id: r.id,
    nombre: `${r.primer_nombre} ${r.primer_apellido}`.trim(),
    documento: `${r.tipo_documento.includes('Pasaporte') ? 'PAS' : 'CC'} ${r.numero_documento}`,
    estado: r.estado,
    telefono: r.telefono,
    usuario: r.usuario_sistema,
  }))
}

async function crearReciclador({ nombre, documento, telefono, usuario }) {
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
  const tipoDoc = docPartes[0] === 'PAS' ? 'Pasaporte' : 'Cédula (CC)'
  const numDoc = docPartes.slice(1).join('')

  const errDoc = validarSoloNumeros(numDoc, 'El número de documento')
  if (errDoc) throw new Error(errDoc)

  const errTel = validarSoloNumerosOpcional(telefono, 'El teléfono')
  if (errTel) throw new Error(errTel)

  const [result] = await pool.query(
    `INSERT INTO recicladores
     (tipo_documento, numero_documento, primer_nombre, primer_apellido, telefono, usuario_sistema)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tipoDoc, numDoc, primerNom, primerApe, telefono || '', usuario || '']
  )

  return { id: result.insertId, nombre, documento, estado: 'Activo' }
}

async function eliminarReciclador(id) {
  const [result] = await pool.query('DELETE FROM recicladores WHERE id = ?', [id])

  if (result.affectedRows === 0) {
    const error = new Error('Reciclador no encontrado.')
    error.statusCode = 404
    throw error
  }

  return { mensaje: 'Reciclador eliminado correctamente.' }
}

module.exports = { listarRecicladores, crearReciclador, eliminarReciclador }