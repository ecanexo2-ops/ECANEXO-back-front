const { ok, fail } = require('../utils/response')
const { clienteService } = require('ecanexo-backend')

async function getClientes(req, res) {
  try {
    const clientes = await clienteService.listarClientes(req.query.q)
    return ok(res, clientes)
  } catch (error) {
    return fail(res, error.message || 'Error al listar clientes.', 500)
  }
}

async function createCliente(req, res) {
  try {
    const cliente = await clienteService.crearCliente(req.body || {})
    return ok(res, cliente, 201)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(res, 'Ya existe un cliente con ese documento.')
    }
    return fail(res, error.message || 'Error al crear cliente.', 500)
  }
}

async function updateCliente(req, res) {
  try {
    const cliente = await clienteService.actualizarCliente(req.params.id, req.body || {})
    return ok(res, cliente)
  } catch (error) {
    return fail(res, error.message || 'Error al actualizar cliente.', 500)
  }
}

async function deleteCliente(req, res) {
  try {
    const resultado = await clienteService.eliminarCliente(req.params.id)
    return ok(res, resultado)
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return fail(res, 'No se puede eliminar: el cliente tiene registros asociados.')
    }
    return fail(res, error.message || 'Error al eliminar cliente.', error.statusCode || 500)
  }
}

module.exports = { getClientes, createCliente, updateCliente, deleteCliente }