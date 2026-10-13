const { ok, fail } = require('../utils/response')
const { ventaService } = require('ecanexo-backend')

async function getVentas(req, res) {
  try {
    const ventas = await ventaService.listarVentas()
    return ok(res, ventas)
  } catch (error) {
    return fail(res, error.message || 'Error al listar ventas.', 500)
  }
}

async function createVenta(req, res) {
  try {
    const venta = await ventaService.crearVenta(req.body || {})
    return ok(res, venta, 201)
  } catch (error) {
    return fail(res, error.message || 'Error al crear venta.', 500)
  }
}

module.exports = { getVentas, createVenta }