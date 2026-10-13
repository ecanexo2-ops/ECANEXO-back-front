const express = require('express')
const { getRecicladores, createReciclador, deleteReciclador } = require('../controllers/recicladorController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getRecicladores)
router.post('/', auth, soloRol('Planillero', 'Admin'), createReciclador)
router.delete('/:id', auth, soloRol('Planillero', 'Admin'), deleteReciclador)

module.exports = router