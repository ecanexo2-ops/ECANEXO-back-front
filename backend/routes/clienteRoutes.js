const express = require('express')
const { getClientes, createCliente, updateCliente, deleteCliente } = require('../controllers/clienteController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getClientes)
router.post('/', auth, soloRol('Caja', 'Admin'), createCliente)
router.put('/:id', auth, soloRol('Caja', 'Admin'), updateCliente)
router.delete('/:id', auth, soloRol('Caja', 'Admin'), deleteCliente)

module.exports = router