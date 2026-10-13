require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/authRoutes')
const usuarioRoutes = require('./routes/usuarioRoutes')
const clienteRoutes = require('./routes/clienteRoutes')
const recicladorRoutes = require('./routes/recicladorRoutes')
const solicitudRoutes = require('./routes/solicitudRoutes')
const pagoRoutes = require('./routes/pagoRoutes')
const ventaRoutes = require('./routes/ventaRoutes')
const productoRoutes = require('./routes/productoRoutes')
const pagoRecicladorRoutes = require('./routes/pagoRecicladorRoutes')
const tarifaRoutes = require('./routes/tarifaRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')

const app = express()
const PORT = process.env.PORT || 4000
const ORIGENES = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGENES.includes(origin)) return cb(null, true)
    cb(new Error('Origen no permitido por CORS.'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'up' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/recicladores', recicladorRoutes)
app.use('/api/solicitudes', solicitudRoutes)
app.use('/api/pagos', pagoRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/pagos-reciclador', pagoRecicladorRoutes)
app.use('/api/tarifas', tarifaRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, message: 'Error interno del servidor.' })
})

app.listen(PORT, () => {
  console.log(`✅ API ECANEXO corriendo en http://localhost:${PORT}`)
})

module.exports = app