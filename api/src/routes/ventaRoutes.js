const express = require('express')
const { getVentas, createVenta } = require('../controllers/ventaController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getVentas)
router.post('/', auth, soloRol('Caja', 'Admin'), createVenta)

module.exports = router