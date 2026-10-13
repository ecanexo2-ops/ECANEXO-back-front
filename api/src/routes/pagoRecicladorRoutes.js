const express = require('express')
const { getPagosReciclador, createPagoReciclador } = require('../controllers/pagoRecicladorController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getPagosReciclador)
router.post('/', auth, soloRol('Planillero', 'Admin'), createPagoReciclador)

module.exports = router