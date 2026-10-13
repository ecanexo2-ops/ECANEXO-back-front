import request from 'supertest';
import express from 'express';

// Simulamos los controladores de solicitud
jest.mock('../../controllers/solicitudController', () => ({
  getSolicitudes: jest.fn((req, res) => res.status(200).json([{ id: 1, descripcion: 'Prueba' }])),
  createSolicitud: jest.fn((req, res) => res.status(201).json({ ok: true, ...req.body })),
}), { virtual: true });

// Simulamos auth y soloRol con el mismo comportamiento de tus otras pruebas
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) =>
    req.headers.authorization ? next() : res.status(401).json({ error: 'No autorizado' })
  ),
  soloRol: jest.fn((...roles) => (req, res, next) =>
    roles.includes(req.headers['x-rol']) ? next() : res.status(403).json({ error: 'Prohibido' })
  ),
}), { virtual: true });

import router from '../solicitudRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getSolicitudes, createSolicitud,
} from '../../controllers/solicitudController';

// Guardamos las llamadas a soloRol al cargar el router
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/solicitudes', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - solicitudRoutes', () => {

  test('las rutas protegidas se configuran con roles Caja y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Caja', 'Admin'], // POST /
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/solicitudes');
    expect(res.statusCode).toBe(401);
    expect(getSolicitudes).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getSolicitudes', async () => {
    const res = await request(app).get('/solicitudes').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getSolicitudes).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/solicitudes').send({});
    expect(res.statusCode).toBe(401);
    expect(createSolicitud).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/solicitudes').set(TOKEN).set('x-rol', 'Cliente').send({});
    expect(res.statusCode).toBe(403);
    expect(createSolicitud).not.toHaveBeenCalled();
  });

  test('POST / con rol Caja llama a createSolicitud', async () => {
    const res = await request(app)
      .post('/solicitudes').set(TOKEN).set('x-rol', 'Caja').send({ tipo: 'Plástico' });
    expect(res.statusCode).toBe(201);
    expect(createSolicitud).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createSolicitud', async () => {
    const res = await request(app)
      .post('/solicitudes').set(TOKEN).set('x-rol', 'Admin').send({ tipo: 'Plástico' });
    expect(res.statusCode).toBe(201);
  });

});