const { ok, fail } = require('../utils/response')
const { solicitudService } = require('ecanexo-backend')

async function getSolicitudes(req, res) {
  try {
    const solicitudes = await solicitudService.listarSolicitudes()
    return ok(res, solicitudes)
  } catch (error) {
    return fail(res, error.message || 'Error al listar solicitudes.', 500)
  }
}

async function createSolicitud(req, res) {
  try {
    const solicitud = await solicitudService.crearSolicitud(req.body || {})
    return ok(res, solicitud, 201)
  } catch (error) {
    return fail(res, error.message || 'Error al crear solicitud.', 500)
  }
}

module.exports = { getSolicitudes, createSolicitud }