const { ok, fail } = require('../utils/response')
const { pagoService } = require('ecanexo-backend')

async function getPagos(req, res) {
  try {
    const pagos = await pagoService.listarPagos()
    return ok(res, pagos)
  } catch (error) {
    return fail(res, error.message || 'Error al listar pagos.', 500)
  }
}

async function createPago(req, res) {
  try {
    const pago = await pagoService.crearPago(req.body || {})
    return ok(res, pago, 201)
  } catch (error) {
    return fail(res, error.message || 'Error al crear pago.', 500)
  }
}

module.exports = { getPagos, createPago }