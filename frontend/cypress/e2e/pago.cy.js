// cypress/e2e/pago.cy.js
// Pruebas de caja negra - módulo Pagos (API ECANEXO)

const API = 'http://localhost:4000/api';

const USUARIOS = {
  caja:       { username: 'caja',       password: '1234' },
  planillero: { username: 'planillero', password: '1234' },   // rol sin permiso para crear pagos
};

// Precio de venta del Cartón en tu tabla "materiales" (el SQL inicial dice 350).
// AJUSTAR si lo cambiaste desde el módulo de tarifas.
const PRECIO_CARTON = 350;

// Cliente fijo para las pruebas. Se crea una sola vez y se reutiliza,
// porque un cliente con pagos ya no se puede eliminar.
const CLIENTE_PRUEBA = {
  nombre: 'Cliente PruebaPago',
  documento: 'CC 900000001',
  tipo: 'Externo',
  email: 'prueba.pago@correo.com',
  telefono: '3000000000',
};

// El login entrega el token en la cookie "ecanexo_token"; lo leemos del header Set-Cookie.
const login = ({ username, password }) =>
  cy.request('POST', `${API}/auth/login`, { username, password }).then((res) => {
    const cookies = [].concat(res.headers['set-cookie'] || []);
    const cookie = cookies.find((c) => c.startsWith('ecanexo_token='));
    return cookie.split(';')[0].split('=')[1];
  });

describe('Pruebas de Caja Negra - Pagos (API)', () => {
  const tokens = {};
  const conToken = (rol) => ({ Authorization: `Bearer ${tokens[rol]}` });
  const pagoValido = { cliente: CLIENTE_PRUEBA.nombre, material: 'Cartón', kg: 2 };
  let idPago;

  before(() => {
    login(USUARIOS.caja).then((t) => (tokens.caja = t));
    login(USUARIOS.planillero).then((t) => (tokens.planillero = t));

    // Cada login deja su cookie en el navegador (la última sería la de planillero) y el API
    // da prioridad a la cookie sobre el header Bearer. Se limpian para actuar como "caja".
    cy.clearCookies();

    // Crea el cliente de prueba; si ya existe (documento duplicado) se ignora ese error.
    // Después se comprueba que realmente exista con ese nombre y, si no, se muestra por qué.
    cy.then(() =>
      cy.request({
        method: 'POST',
        url: `${API}/clientes`,
        headers: conToken('caja'),
        body: CLIENTE_PRUEBA,
        failOnStatusCode: false,
      }).then((crear) => {
        cy.request({
          url: `${API}/clientes?q=900000001`,
          headers: conToken('caja'),
        }).then((lista) => {
          const existe = lista.body.data.some((c) => c.nombre === CLIENTE_PRUEBA.nombre);
          expect(
            existe,
            `No existe el cliente "${CLIENTE_PRUEBA.nombre}". Respuesta al crearlo: ${crear.status} ${JSON.stringify(crear.body)}. Clientes con ese documento: ${JSON.stringify(lista.body.data)}`
          ).to.eq(true);
        });
      })
    );
  });

  // El middleware da prioridad a la cookie sobre el header Bearer.
  beforeEach(() => {
    cy.clearCookies();
  });

  // ---------- GET ----------
  it('CP-PAG-01: GET sin token responde 401', () => {
    cy.request({ url: `${API}/pagos`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.success).to.eq(false);
    });
  });

  it('CP-PAG-02: GET con token responde 200 y devuelve una lista', () => {
    cy.request({ url: `${API}/pagos`, headers: conToken('planillero') }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.be.an('array');
    });
  });

  // ---------- POST: permisos ----------
  it('CP-PAG-03: POST sin token responde 401', () => {
    cy.request({
      method: 'POST',
      url: `${API}/pagos`,
      body: pagoValido,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-PAG-04: POST con rol Planillero responde 403', () => {
    cy.request({
      method: 'POST',
      url: `${API}/pagos`,
      headers: conToken('planillero'),
      body: pagoValido,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  // ---------- POST: casos válidos ----------
  it('CP-PAG-05: POST con rol Caja crea el pago y calcula el total', () => {
    cy.request({
      method: 'POST',
      url: `${API}/pagos`,
      headers: conToken('caja'),
      body: pagoValido,
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data.monto).to.eq(PRECIO_CARTON * pagoValido.kg);
      expect(res.body.data.estado).to.eq('Pagado');
      idPago = res.body.data.id;
    });
  });

  it('CP-PAG-06: POST acepta el material en minúsculas y sin tilde', () => {
    cy.request({
      method: 'POST',
      url: `${API}/pagos`,
      headers: conToken('caja'),
      body: { ...pagoValido, material: 'carton' },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.data.monto).to.eq(PRECIO_CARTON * pagoValido.kg);
    });
  });

  it('CP-PAG-07: el pago creado aparece en la lista con sus datos', () => {
    cy.request({ url: `${API}/pagos`, headers: conToken('planillero') }).then((res) => {
      const pago = res.body.data.find((p) => p.id === idPago);
      expect(pago, 'el pago creado debe estar en la lista').to.exist;
      expect(pago.cliente).to.eq(CLIENTE_PRUEBA.nombre);
      expect(pago.material).to.eq('Cartón');
      expect(pago.monto).to.eq(PRECIO_CARTON * pagoValido.kg);
      expect(pago.estado).to.eq('Pagado');
      expect(pago.recibo).to.match(/^#R\d{3,}$/);
    });
  });

  // ---------- POST: casos inválidos ----------
  // Nota: tu API responde 500 (no 400) en errores de validación, por eso se valida "status >= 400".
  const esRechazado = (res, mensaje) => {
    expect(res.status).to.be.gte(400);
    expect(res.body.success).to.eq(false);
    if (mensaje) expect(res.body.message).to.eq(mensaje);
  };

  it('CP-PAG-08: POST con peso 0 es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { ...pagoValido, kg: 0 }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El peso debe ser un número mayor a 0.'));
  });

  it('CP-PAG-09: POST con peso negativo es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { ...pagoValido, kg: -5 }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El peso debe ser un número mayor a 0.'));
  });

  it('CP-PAG-10: POST con peso no numérico es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { ...pagoValido, kg: 'abc' }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El peso debe ser un número mayor a 0.'));
  });

  it('CP-PAG-11: POST sin cliente es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { material: 'Cartón', kg: 2 }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'Cliente y material son obligatorios.'));
  });

  it('CP-PAG-12: POST sin material es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { cliente: CLIENTE_PRUEBA.nombre, kg: 2 }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'Cliente y material son obligatorios.'));
  });

  it('CP-PAG-13: POST con un cliente que no existe es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { ...pagoValido, cliente: 'Persona Inexistente' }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'Cliente no encontrado.'));
  });

  it('CP-PAG-14: POST con un material que no existe es rechazado', () => {
    cy.request({
      method: 'POST', url: `${API}/pagos`, headers: conToken('caja'),
      body: { ...pagoValido, material: 'Uranio' }, failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'Material no encontrado.'));
  });
});