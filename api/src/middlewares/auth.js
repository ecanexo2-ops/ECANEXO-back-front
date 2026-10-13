const jwt = require('jsonwebtoken')
const { fail } = require('../utils/response')
const { constants } = require('ecanexo-backend')

const { SECRET, COOKIE } = constants

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'

  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

function auth(req, res, next) {
  const header = req.headers['authorization'] || ''
  const tokenHeader = header.startsWith('Bearer ') ? header.slice(7) : null
  const token = req.cookies?.[COOKIE] || tokenHeader

  if (!token) return fail(res, 'Token requerido.', 401)

  try {
    req.user = jwt.verify(token, SECRET)
    return next()
  } catch (error) {
    return fail(res, 'Token inválido o expirado.', 401)
  }
}

function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return fail(res, 'No tienes permiso para esta acción.', 403)
    }
    return next()
  }
}

module.exports = {
  auth,
  soloRol,
  setAuthCookie,
}