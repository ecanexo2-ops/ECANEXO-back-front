const { ok, fail } = require('../utils/response')
const { dashboardService } = require('ecanexo-backend')

async function dashboardController(req, res) {
  try {
    const dashboard = await dashboardService.getDashboard()
    return ok(res, dashboard)
  } catch (error) {
    return fail(res, error.message || 'Error al consultar dashboard.', 500)
  }
}

module.exports = { dashboardController }