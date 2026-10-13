const { ok, fail } = require('../utils/response')
const { pagoRecicladorService } = require('ecanexo-backend')

async function getPagosReciclador(req, res) {
  try {
    const pagos = await pagoRecicladorService.listarPagosReciclador()
    return ok(res, pagos)
  } catch (error) {
    return fail(res, error.message || 'Error al listar pagos del reciclador.', 500)
  }
}

async function createPagoReciclador(req, res) {
  try {
    const pago = await pagoRecicladorService.crearPagoReciclador(req.body || {})
    return ok(res, pago, 201)
  } catch (error) {
    return fail(res, error.message || 'Error al crear pago al reciclador.', 500)
  }
}

module.exports = { getPagosReciclador, createPagoReciclador }