// cypress/e2e/cliente.cy.js
// Pruebas de caja negra - módulo Clientes (API ECANEXO)

const API = 'http://localhost:4000/api';

const USUARIOS = {
  admin:      { username: 'admin',      password: 'admin' },
  caja:       { username: 'caja',       password: '1234' },
  planillero: { username: 'planillero', password: '1234' },   // rol sin permiso para crear/editar/eliminar
};

// El login no devuelve el token en el body: lo entrega en una cookie "ecanexo_token".
// Lo leemos del header Set-Cookie para poder usarlo como "Authorization: Bearer".
const login = ({ username, password }) =>
  cy.request('POST', `${API}/auth/login`, { username, password }).then((res) => {
    const cookies = [].concat(res.headers['set-cookie'] || []);
    const cookie = cookies.find((c) => c.startsWith('ecanexo_token='));
    return cookie.split(';')[0].split('=')[1];
  });

describe('Pruebas de Caja Negra - Clientes (API)', () => {
  const tokens = {};
  const conToken = (rol) => ({ Authorization: `Bearer ${tokens[rol]}` });

  // Datos únicos por ejecución para no chocar con registros existentes
  const numeroDoc = String(Date.now()).slice(-9);
  const nuevoCliente = {
    nombre: 'Ana Prueba',
    documento: `CC ${numeroDoc}`,
    tipo: 'Externo',
    email: 'ana.prueba@correo.com',
    telefono: '3001234567',
  };
  let idCreado;

  before(() => {
    login(USUARIOS.admin).then((t) => (tokens.admin = t));
    login(USUARIOS.caja).then((t) => (tokens.caja = t));
    login(USUARIOS.planillero).then((t) => (tokens.planillero = t));
  });

  // El middleware da prioridad a la cookie sobre el header Bearer,
  // por eso limpiamos cookies antes de cada prueba.
  beforeEach(() => {
    cy.clearCookies();
  });

  // ---------- GET ----------
  it('CP-CLI-01: GET sin token responde 401', () => {
    cy.request({ url: `${API}/clientes`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.success).to.eq(false);
    });
  });

  it('CP-CLI-02: GET con token responde 200 y devuelve una lista', () => {
    cy.request({ url: `${API}/clientes`, headers: conToken('planillero') }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.be.an('array');
    });
  });

  // ---------- POST ----------
  it('CP-CLI-03: POST sin token responde 401', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      body: nuevoCliente,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-CLI-04: POST con rol Planillero responde 403', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      headers: conToken('planillero'),
      body: nuevoCliente,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('CP-CLI-05: POST con rol Caja crea el cliente', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      headers: conToken('caja'),
      body: nuevoCliente,
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data.nombre).to.eq(nuevoCliente.nombre);
      idCreado = res.body.data.id;
    });
  });

  it('CP-CLI-06: POST con documento duplicado es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      headers: conToken('caja'),
      body: nuevoCliente,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.success).to.eq(false);
      expect(res.body.message).to.contain('Ya existe un cliente');
    });
  });

  it('CP-CLI-07: POST con nombre que contiene números es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      headers: conToken('caja'),
      body: { ...nuevoCliente, nombre: 'Ana123', documento: `CC ${numeroDoc}1` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.gte(400);
      expect(res.body.success).to.eq(false);
    });
  });

  it('CP-CLI-08: POST con documento que contiene letras es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/clientes`,
      headers: conToken('caja'),
      body: { ...nuevoCliente, documento: 'CC 12AB34' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.gte(400);
      expect(res.body.success).to.eq(false);
    });
  });

  // ---------- GET con búsqueda ----------
  it('CP-CLI-09: GET con ?q= encuentra el cliente creado', () => {
    cy.request({
      url: `${API}/clientes?q=${numeroDoc}`,
      headers: conToken('planillero'),
    }).then((res) => {
      expect(res.status).to.eq(200);
      const ids = res.body.data.map((c) => c.id);
      expect(ids).to.include(idCreado);
    });
  });

  // ---------- PUT ----------
  it('CP-CLI-10: PUT con rol Planillero responde 403', () => {
    cy.request({
      method: 'PUT',
      url: `${API}/clientes/${idCreado}`,
      headers: conToken('planillero'),
      body: { nombre: 'Luis Editado', tipo: 'Externo', email: 'luis@correo.com', telefono: '3009999999' },
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('CP-CLI-11: PUT con rol Caja actualiza el cliente', () => {
    cy.request({
      method: 'PUT',
      url: `${API}/clientes/${idCreado}`,
      headers: conToken('caja'),
      body: { nombre: 'Luis Editado', tipo: 'Empresa', email: 'luis@correo.com', telefono: '3009999999' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
      expect(res.body.data.nombre).to.eq('Luis Editado');
      expect(res.body.data.tipo).to.eq('Empresa');
    });
  });

  // ---------- DELETE ----------
  it('CP-CLI-12: DELETE sin token responde 401', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/clientes/${idCreado}`,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-CLI-13: DELETE con rol Planillero responde 403', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/clientes/${idCreado}`,
      headers: conToken('planillero'),
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('CP-CLI-14: DELETE con rol Admin elimina el cliente', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/clientes/${idCreado}`,
      headers: conToken('admin'),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
    });
  });

  it('CP-CLI-15: DELETE de un cliente que ya no existe responde 404', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/clientes/${idCreado}`,
      headers: conToken('admin'),
      failOnStatusCode: false,
    }).its('status').should('eq', 404);
  });
});