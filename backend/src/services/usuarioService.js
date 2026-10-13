const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { ROLES_VALIDOS, USUARIO_VALIDO } = require('../config/constants')

async function listarUsuarios() {
  const [rows] = await pool.query(
    'SELECT id, nombre_usuario, rol, estado FROM usuarios ORDER BY id DESC'
  )

  return rows.map((u) => ({
    id: u.id,
    usuario: u.nombre_usuario,
    rol: u.rol,
    estado: u.estado,
  }))
}

async function crearUsuario({ usuario, password, confirmarPassword, rol }) {
  if (!usuario || !String(usuario).trim()) throw new Error('El usuario es obligatorio.')
  if (!USUARIO_VALIDO.test(usuario)) {
    throw new Error('El usuario solo puede contener letras, números, puntos y guion bajo.')
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }
  if (confirmarPassword !== undefined && password !== confirmarPassword) {
    throw new Error('Las contraseñas no coinciden.')
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new Error(`El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`)
  }

  const hash = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre_usuario, contrasenia, rol, estado)
     VALUES (?, ?, ?, 'Activo')`,
    [String(usuario).trim().toLowerCase(), hash, rol]
  )

  return {
    id: result.insertId,
    usuario: usuario.trim().toLowerCase(),
    rol,
    estado: 'Activo',
  }
}

async function eliminarUsuario(id, usernameActual) {
  const [rows] = await pool.query('SELECT nombre_usuario FROM usuarios WHERE id = ?', [id])

  if (rows.length === 0) {
    const error = new Error('Usuario no encontrado.')
    error.statusCode = 404
    throw error
  }

  if (rows[0].nombre_usuario === usernameActual) {
    const error = new Error('No puedes eliminar tu propio usuario mientras tienes la sesión activa.')
    error.statusCode = 400
    throw error
  }

  await pool.query('DELETE FROM usuarios WHERE id = ?', [id])
  return { mensaje: 'Usuario eliminado.' }
}

module.exports = { listarUsuarios, crearUsuario, eliminarUsuario }