const express = require('express')
const { getUsuarios, createUsuario, deleteUsuario } = require('../controllers/usuarioController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, soloRol('Admin'), getUsuarios)
router.post('/', auth, soloRol('Admin'), createUsuario)
router.delete('/:id', auth, soloRol('Admin'), deleteUsuario)

module.exports = router