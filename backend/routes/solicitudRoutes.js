const express = require('express')
const { getSolicitudes, createSolicitud } = require('../controllers/solicitudController')
const { auth, soloRol } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, getSolicitudes)
router.post('/', auth, soloRol('Caja', 'Admin'), createSolicitud)

module.exports = router