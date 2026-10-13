const { ok, fail } = require('../utils/response')
const { usuarioService } = require('ecanexo-backend')

async function getUsuarios(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios()
    return ok(res, usuarios)
  } catch (error) {
    return fail(res, error.message || 'Error al listar usuarios.', 500)
  }
}

async function createUsuario(req, res) {
  try {
    const nuevoUsuario = await usuarioService.crearUsuario(req.body || {})
    return ok(res, nuevoUsuario, 201)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(res, 'Ese nombre de usuario ya existe.')
    }
    return fail(res, error.message || 'Error al crear usuario.', 500)
  }
}

async function deleteUsuario(req, res) {
  try {
    const respuesta = await usuarioService.eliminarUsuario(req.params.id, req.user.username)
    return ok(res, respuesta)
  } catch (error) {
    return fail(res, error.message || 'Error al eliminar usuario.', error.statusCode || 500)
  }
}

module.exports = { getUsuarios, createUsuario, deleteUsuario }