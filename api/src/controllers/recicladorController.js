const { ok, fail } = require('../utils/response')
const { recicladorService } = require('ecanexo-backend')

async function getRecicladores(req, res) {
  try {
    const recicladores = await recicladorService.listarRecicladores()
    return ok(res, recicladores)
  } catch (error) {
    return fail(res, error.message || 'Error al listar recicladores.', 500)
  }
}

async function createReciclador(req, res) {
  try {
    const reciclador = await recicladorService.crearReciclador(req.body || {})
    return ok(res, reciclador, 201)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(res, 'Ya existe un reciclador con ese documento.')
    }
    return fail(res, error.message || 'Error al crear reciclador.', 500)
  }
}

async function deleteReciclador(req, res) {
  try {
    const resultado = await recicladorService.eliminarReciclador(req.params.id)
    return ok(res, resultado)
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return fail(res, 'No se puede eliminar: el reciclador tiene registros asociados.')
    }
    return fail(res, error.message || 'Error al eliminar reciclador.', error.statusCode || 500)
  }
}

module.exports = { getRecicladores, createReciclador, deleteReciclador }