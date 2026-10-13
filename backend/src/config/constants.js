const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../backend/.env') })

const COOKIE = 'ecanexo_token'
const SECRET = process.env.JWT_SECRET || 'ecanexo_clave_secreta'
const ROLES_VALIDOS = ['Caja', 'Planillero', 'Admin']
const USUARIO_VALIDO = /^[A-Za-z0-9._]+$/

module.exports = {
  COOKIE,
  SECRET,
  ROLES_VALIDOS,
  USUARIO_VALIDO,
}