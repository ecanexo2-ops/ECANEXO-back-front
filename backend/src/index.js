// Expone TODOS los servicios + constantes como una librería.
// El API hace: const backend = require('ecanexo-backend')
//              backend.clienteService.listarClientes()

const constants = require('./config/constants')

module.exports = {
  constants,
  authService:           require('./services/authService'),
  clienteService:        require('./services/clienteService'),
  dashboardService:      require('./services/dashboardService'),
  pagoService:           require('./services/pagoService'),
  pagoRecicladorService: require('./services/pagoRecicladorService'),
  productoService:       require('./services/productoService'),
  recicladorService:     require('./services/recicladorService'),
  solicitudService:      require('./services/solicitudService'),
  tarifaService:         require('./services/tarifaService'),
  usuarioService:        require('./services/usuarioService'),
  ventaService:          require('./services/ventaService'),
}