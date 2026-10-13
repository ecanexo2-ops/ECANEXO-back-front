// El frontend se comunica con el API (capa HTTP) por HTTP.
// El API internamente usa el backend (capa lógica) para acceder a MySQL.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// La sesión viaja en una cookie httpOnly (ecanexo_token) que el backend
// setea tras el login. El navegador la reenvía automáticamente gracias a
// `credentials: 'include'`. No hay tokens en localStorage.

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  // Si el token expiró o no es válido, avisamos al App para que vuelva al login.
  if (res.status === 401) {
    window.dispatchEvent(new Event('session-expired'))
  }

  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Error de red')
  }
  return json.data
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),

  getClientes:       (q)     => request(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  crearCliente:      (c)     => request('/clientes',           { method: 'POST', body: JSON.stringify(c) }),
  actualizarCliente: (id, c) => request(`/clientes/${id}`,     { method: 'PUT',  body: JSON.stringify(c) }),

  getRecicladores:   ()  => request('/recicladores'),
  crearReciclador:   (r) => request('/recicladores',           { method: 'POST', body: JSON.stringify(r) }),

  getSolicitudes:    ()  => request('/solicitudes'),
  crearSolicitud:    (s) => request('/solicitudes',            { method: 'POST', body: JSON.stringify(s) }),

  getPagos:          ()  => request('/pagos'),
  crearPago:         (p) => request('/pagos',                  { method: 'POST', body: JSON.stringify(p) }),

  getVentas:         ()  => request('/ventas'),
  crearVenta:        (v) => request('/ventas',                 { method: 'POST', body: JSON.stringify(v) }),

  getProductos:      ()  => request('/productos'),
  registrarEntradaProducto: (e) => request('/productos/entrada', { method: 'POST', body: JSON.stringify(e) }),

  getPagosReciclador:  ()  => request('/pagos-reciclador'),
  crearPagoReciclador: (p) => request('/pagos-reciclador',     { method: 'POST', body: JSON.stringify(p) }),

  getTarifas:   () => request('/tarifas'),
  getDashboard: () => request('/dashboard'),

  eliminarCliente:    (id) => request(`/clientes/${id}`,    { method: 'DELETE' }),
  eliminarReciclador: (id) => request(`/recicladores/${id}`, { method: 'DELETE' }),

  getUsuarios:     ()   => request('/usuarios'),
  crearUsuario:    (u)  => request('/usuarios',      { method: 'POST',   body: JSON.stringify(u) }),
  eliminarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
}