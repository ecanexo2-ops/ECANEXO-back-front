const { ok, fail } = require('../utils/response')
const { setAuthCookie } = require('../middlewares/auth')
const { authService } = require('ecanexo-backend')

async function loginController(req, res) {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return fail(res, 'Usuario y contraseña requeridos.')
    }

    const { token, user } = await authService.login(username, password)
    setAuthCookie(res, token)

    return ok(res, { username: user.username, role: user.role, initials: user.initials })
  } catch (error) {
    return fail(res, error.message || 'Error al iniciar sesión.', error.statusCode || 500)
  }
}

function logoutController(req, res) {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('ecanexo_token', {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  })
  return ok(res, { mensaje: 'Sesión cerrada.' })
}

function meController(req, res) {
  return ok(res, { username: req.user.username, role: req.user.role })
}

module.exports = { loginController, logoutController, meController }