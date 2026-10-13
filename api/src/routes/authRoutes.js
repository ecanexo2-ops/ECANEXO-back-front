const express = require('express')
const rateLimit = require('express-rate-limit')
const { loginController, logoutController, meController } = require('../controllers/authController')
const { auth } = require('../middlewares/auth')

const router = express.Router()

// Rate limit específico para login: máx 10 intentos cada 15 minutos por IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },
})

router.post('/login', loginLimiter, loginController)
router.post('/logout', logoutController)
router.get('/me', auth, meController)

module.exports = router