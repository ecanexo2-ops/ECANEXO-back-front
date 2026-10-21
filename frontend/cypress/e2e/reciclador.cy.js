// cypress/e2e/reciclador.cy.js
// Pruebas de caja negra - módulo Recicladores (API ECANEXO)

const API = 'http://localhost:4000/api';

const USUARIOS = {
  admin:      { username: 'admin',      password: 'admin' },
  planillero: { username: 'planillero', password: '1234' },
  caja:       { username: 'caja',       password: '1234' },   // rol sin permiso para crear/eliminar recicladores
};

// El login entrega el token en la cookie "ecanexo_token"; lo leemos del header Set-Cookie.
const login = ({ username, password }) =>
  cy.request('POST', `${API}/auth/login`, { username, password }).then((res) => {
    const cookies = [].concat(res.headers['set-cookie'] || []);
    const cookie = cookies.find((c) => c.startsWith('ecanexo_token='));
    return cookie.split(';')[0].split('=')[1];
  });

describe('Pruebas de Caja Negra - Recicladores (API)', () => {
  const tokens = {};
  const conToken = (rol) => ({ Authorization: `Bearer ${tokens[rol]}` });

  // Datos únicos por ejecución para no chocar con registros existentes
  const numeroDoc = String(Date.now()).slice(-9);
  const nuevoReciclador = {
    nombre: 'Carlos Reciclador',
    documento: `CC ${numeroDoc}`,
    telefono: '3101234567',
    usuario: 'carlos.rec',
  };
  let idCreado;

  before(() => {
    login(USUARIOS.admin).then((t) => (tokens.admin = t));
    login(USUARIOS.planillero).then((t) => (tokens.planillero = t));
    login(USUARIOS.caja).then((t) => (tokens.caja = t));
  });

  // El middleware da prioridad a la cookie sobre el header Bearer,
  // por eso limpiamos cookies antes de cada prueba.
  beforeEach(() => {
    cy.clearCookies();
  });

  // Nota: tu API responde 500 (no 400) en errores de validación,
  // por eso se valida "status >= 400" y el mensaje exacto.
  const esRechazado = (res, mensaje) => {
    expect(res.status).to.be.gte(400);
    expect(res.body.success).to.eq(false);
    if (mensaje) expect(res.body.message).to.eq(mensaje);
  };

  // ---------- GET ----------
  it('CP-REC-01: GET sin token responde 401', () => {
    cy.request({ url: `${API}/recicladores`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.success).to.eq(false);
    });
  });

  it('CP-REC-02: GET con token (rol Caja) responde 200 y devuelve una lista', () => {
    cy.request({ url: `${API}/recicladores`, headers: conToken('caja') }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.be.an('array');
    });
  });

  // ---------- POST: permisos ----------
  it('CP-REC-03: POST sin token responde 401', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      body: nuevoReciclador,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-REC-04: POST con rol Caja responde 403', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('caja'),
      body: nuevoReciclador,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  // ---------- POST: casos válidos ----------
  it('CP-REC-05: POST con rol Planillero crea el reciclador', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: nuevoReciclador,
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data.nombre).to.eq(nuevoReciclador.nombre);
      expect(res.body.data.estado).to.eq('Activo');
      idCreado = res.body.data.id;
    });
  });

  it('CP-REC-06: el reciclador creado aparece en la lista con sus datos', () => {
    cy.request({ url: `${API}/recicladores`, headers: conToken('caja') }).then((res) => {
      const rec = res.body.data.find((r) => r.id === idCreado);
      expect(rec, 'el reciclador creado debe estar en la lista').to.exist;
      expect(rec.nombre).to.eq(nuevoReciclador.nombre);
      expect(rec.documento).to.eq(nuevoReciclador.documento);
      expect(rec.telefono).to.eq(nuevoReciclador.telefono);
      expect(rec.usuario).to.eq(nuevoReciclador.usuario);
      expect(rec.estado).to.eq('Activo');
    });
  });

  // ---------- POST: casos inválidos ----------
  it('CP-REC-07: POST con documento duplicado es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: nuevoReciclador,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.success).to.eq(false);
      expect(res.body.message).to.eq('Ya existe un reciclador con ese documento.');
    });
  });

  it('CP-REC-08: POST con nombre que contiene números es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: { ...nuevoReciclador, nombre: 'Ana123', documento: `CC ${numeroDoc}1` },
      failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El nombre solo puede contener letras.'));
  });

  it('CP-REC-09: POST con documento que contiene letras es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: { ...nuevoReciclador, documento: 'CC 12AB34' },
      failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El número de documento solo puede contener números.'));
  });

  it('CP-REC-10: POST con teléfono que contiene letras es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: { ...nuevoReciclador, documento: `CC ${numeroDoc}2`, telefono: '310ABC4567' },
      failOnStatusCode: false,
    }).then((res) => esRechazado(res, 'El teléfono solo puede contener números.'));
  });

  it('CP-REC-11: POST sin documento es rechazado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/recicladores`,
      headers: conToken('planillero'),
      body: { nombre: 'Carlos Reciclador', telefono: '3101234567' },
      failOnStatusCode: false,
    }).then((res) => esRechazado(res));
  });

  // ---------- DELETE ----------
  it('CP-REC-12: DELETE sin token responde 401', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/recicladores/${idCreado}`,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-REC-13: DELETE con rol Caja responde 403', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/recicladores/${idCreado}`,
      headers: conToken('caja'),
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('CP-REC-14: DELETE con rol Admin elimina el reciclador', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/recicladores/${idCreado}`,
      headers: conToken('admin'),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
    });
  });

  it('CP-REC-15: el reciclador eliminado ya no aparece en la lista', () => {
    cy.request({ url: `${API}/recicladores`, headers: conToken('caja') }).then((res) => {
      const ids = res.body.data.map((r) => r.id);
      expect(ids).to.not.include(idCreado);
    });
  });

  it('CP-REC-16: DELETE de un reciclador que ya no existe responde 404', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/recicladores/${idCreado}`,
      headers: conToken('admin'),
      failOnStatusCode: false,
    }).its('status').should('eq', 404);
  });
});