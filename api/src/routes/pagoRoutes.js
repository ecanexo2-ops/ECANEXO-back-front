const express = require('express')
const { getPagos, createPago } = require('../controllers/pagoController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getPagos)
router.post('/', auth, soloRol('Caja', 'Admin'), createPago)

module.exports = router