const express = require('express')
const { getProductos, createEntradaProducto } = require('../controllers/productoController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getProductos)
router.post('/entrada', auth, soloRol('Planillero', 'Admin'), createEntradaProducto)

module.exports = router