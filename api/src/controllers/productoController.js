const { ok, fail } = require('../utils/response')
const { productoService } = require('ecanexo-backend')

async function getProductos(req, res) {
  try {
    const productos = await productoService.listarProductos()
    return ok(res, productos)
  } catch (error) {
    return fail(res, error.message || 'Error al listar productos.', 500)
  }
}

async function createEntradaProducto(req, res) {
  try {
    const producto = await productoService.registrarEntradaProducto(req.body || {})
    return ok(res, producto, 201)
  } catch (error) {
    return fail(res, error.message || 'Error al registrar entrada del producto.', 500)
  }
}

module.exports = { getProductos, createEntradaProducto }