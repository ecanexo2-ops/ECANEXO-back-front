// cypress/e2e/solicitud.cy.js
// Pruebas de caja negra - módulo Solicitudes (API ECANEXO)

const API = 'http://localhost:4000/api';

const USUARIOS = {
  caja:       { username: 'caja',       password: '1234' },
  planillero: { username: 'planillero', password: '1234' },   // rol sin permiso para crear solicitudes
};

// Mismo cliente fijo que usa el módulo de pagos. Se crea una sola vez y se reutiliza.
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

describe('Pruebas de Caja Negra - Solicitudes (API)', () => {
  const tokens = {};
  const conToken = (rol) => ({ Authorization: `Bearer ${tokens[rol]}` });

  const solicitudValida = {
    cliente: CLIENTE_PRUEBA.nombre,
    material: 'Cartón, Vidrio',   // varios materiales separados por coma
    cantidadKg: 25,
    fecha: '2026-12-15',
    hora: '10:30',
  };
  let idCreado;

  before(() => {
    login(USUARIOS.caja).then((t) => (tokens.caja = t));
    login(USUARIOS.planillero).then((t) => (tokens.planillero = t));

    // Cada login deja su cookie y el API da prioridad a la cookie sobre el header Bearer.
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
            `No existe el cliente "${CLIENTE_PRUEBA.nombre}". Respuesta al crearlo: ${crear.status} ${JSON.stringify(crear.body)}`
          ).to.eq(true);
        });
      })
    );
  });

  // El middleware da prioridad a la cookie sobre el header Bearer.
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

  const crear = (body, rol = 'caja') =>
    cy.request({
      method: 'POST',
      url: `${API}/solicitudes`,
      headers: conToken(rol),
      body,
      failOnStatusCode: false,
    });

  // ---------- GET ----------
  it('CP-SOL-01: GET sin token responde 401', () => {
    cy.request({ url: `${API}/solicitudes`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.success).to.eq(false);
    });
  });

  it('CP-SOL-02: GET con token responde 200 y devuelve una lista', () => {
    cy.request({ url: `${API}/solicitudes`, headers: conToken('planillero') }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.be.an('array');
    });
  });

  // ---------- POST: permisos ----------
  it('CP-SOL-03: POST sin token responde 401', () => {
    cy.request({
      method: 'POST',
      url: `${API}/solicitudes`,
      body: solicitudValida,
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });

  it('CP-SOL-04: POST con rol Planillero responde 403', () => {
    crear(solicitudValida, 'planillero').its('status').should('eq', 403);
  });

  // ---------- POST: casos válidos ----------
  it('CP-SOL-05: POST con rol Caja crea la solicitud con varios materiales', () => {
    crear(solicitudValida).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data.cliente).to.eq(CLIENTE_PRUEBA.nombre);
      expect(res.body.data.material).to.eq('Cartón, Vidrio');
      expect(res.body.data.cantidadKg).to.eq(25);
      expect(res.body.data.estado).to.eq('Pendiente');
      idCreado = res.body.data.id;
    });
  });

  it('CP-SOL-06: POST acepta materiales en minúsculas y sin tilde', () => {
    crear({ ...solicitudValida, material: 'carton, plastico' }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.data.estado).to.eq('Pendiente');
    });
  });

  it('CP-SOL-07: POST sin fecha ni hora también crea la solicitud', () => {
    const { fecha, hora, ...sinFechaHora } = solicitudValida;
    crear(sinFechaHora).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.success).to.eq(true);
    });
  });

  it('CP-SOL-08: la solicitud creada aparece en la lista con sus datos', () => {
    cy.request({ url: `${API}/solicitudes`, headers: conToken('planillero') }).then((res) => {
      const sol = res.body.data.find((s) => s.id === idCreado);
      expect(sol, 'la solicitud creada debe estar en la lista').to.exist;
      expect(sol.cliente).to.eq(CLIENTE_PRUEBA.nombre);
      expect(sol.material).to.contain('Cartón').and.to.contain('Vidrio');
      expect(Number(sol.cantidadKg)).to.eq(25);
      expect(sol.estado).to.eq('Pendiente');
      expect(sol.hora).to.contain('10:30');
    });
  });

  // ---------- POST: casos inválidos ----------
  it('CP-SOL-09: POST con cantidad 0 es rechazado', () => {
    crear({ ...solicitudValida, cantidadKg: 0 })
      .then((res) => esRechazado(res, 'La cantidad debe ser un número mayor a 0.'));
  });

  it('CP-SOL-10: POST con cantidad negativa es rechazado', () => {
    crear({ ...solicitudValida, cantidadKg: -10 })
      .then((res) => esRechazado(res, 'La cantidad debe ser un número mayor a 0.'));
  });

  it('CP-SOL-11: POST con cantidad no numérica es rechazado', () => {
    crear({ ...solicitudValida, cantidadKg: 'abc' })
      .then((res) => esRechazado(res, 'La cantidad debe ser un número mayor a 0.'));
  });

  it('CP-SOL-12: POST sin cliente es rechazado', () => {
    const { cliente, ...sinCliente } = solicitudValida;
    crear(sinCliente).then((res) => esRechazado(res, 'El cliente es obligatorio.'));
  });

  it('CP-SOL-13: POST sin material es rechazado', () => {
    const { material, ...sinMaterial } = solicitudValida;
    crear(sinMaterial).then((res) => esRechazado(res, 'Debes seleccionar al menos un material.'));
  });

  it('CP-SOL-14: POST con un cliente que no existe es rechazado', () => {
    crear({ ...solicitudValida, cliente: 'Persona Inexistente' })
      .then((res) => esRechazado(res, 'Cliente no encontrado.'));
  });

  it('CP-SOL-15: POST con un material que no existe es rechazado', () => {
    crear({ ...solicitudValida, material: 'Uranio' })
      .then((res) => esRechazado(res, 'Material no encontrado: "Uranio".'));
  });

  it('CP-SOL-16: si un material es inválido no queda ninguna solicitud guardada', () => {
    cy.request({ url: `${API}/solicitudes`, headers: conToken('planillero') }).then((antes) => {
      crear({ ...solicitudValida, material: 'Cartón, Uranio' }).then((res) => {
        esRechazado(res, 'Material no encontrado: "Uranio".');

        cy.request({ url: `${API}/solicitudes`, headers: conToken('planillero') }).then((despues) => {
          expect(despues.body.data.length).to.eq(antes.body.data.length);
        });
      });
    });
  });
});