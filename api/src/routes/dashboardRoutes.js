const express = require('express')
const { dashboardController } = require('../controllers/dashboardController')
const { auth } = require('../middlewares/auth')

const router = express.Router()

router.get('/', auth, dashboardController)

module.exports = router