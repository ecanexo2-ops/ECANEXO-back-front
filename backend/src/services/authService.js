const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const { SECRET } = require('../config/constants')

async function login(username, password) {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE nombre_usuario = ? AND estado = "Activo"',
    [String(username).trim().toLowerCase()]
  )

  if (rows.length === 0) {
    const error = new Error('Usuario o contraseña incorrectos.')
    error.statusCode = 401
    throw error
  }

  const user = rows[0]
  const coincide = await bcrypt.compare(password, user.contrasenia)

  if (!coincide) {
    const error = new Error('Usuario o contraseña incorrectos.')
    error.statusCode = 401
    throw error
  }

  const token = jwt.sign(
    { username: user.nombre_usuario, role: user.rol },
    SECRET,
    { expiresIn: '8h' }
  )

  return {
    token,
    user: {
      username: user.nombre_usuario,
      role: user.rol,
      initials: user.nombre_usuario.slice(0, 2).toUpperCase(),
    },
  }
}

module.exports = { login }