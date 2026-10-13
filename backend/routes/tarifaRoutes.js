const express = require('express')
const { ok, fail } = require('../utils/response')
const { tarifaService } = require('ecanexo-backend')
const { auth } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const tarifas = await tarifaService.listarTarifas()
    return ok(res, tarifas)
  } catch (error) {
    return fail(res, error.message || 'Error al listar tarifas.', 500)
  }
})

module.exports = router