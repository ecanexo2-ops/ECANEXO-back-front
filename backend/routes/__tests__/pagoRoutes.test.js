import request from 'supertest';
import express from 'express';

// Simulamos los controladores de pago
jest.mock('../../controllers/pagoController', () => ({
  getPagos: jest.fn((req, res) => res.status(200).json([{ id: 1, monto: 100 }])),
  createPago: jest.fn((req, res) => res.status(201).json({ ok: true, ...req.body })),
}), { virtual: true });

// Simulamos auth y soloRol con el comportamiento estándar del proyecto
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) =>
    req.headers.authorization ? next() : res.status(401).json({ error: 'No autorizado' })
  ),
  soloRol: jest.fn((...roles) => (req, res, next) =>
    roles.includes(req.headers['x-rol']) ? next() : res.status(403).json({ error: 'Prohibido' })
  ),
}), { virtual: true });

import router from '../pagoRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getPagos, createPago,
} from '../../controllers/pagoController';

// Guardamos las llamadas a soloRol al cargar el router
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/pagos', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - pagoRoutes', () => {

  test('las rutas protegidas se configuran con roles Caja y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Caja', 'Admin'], // POST /
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/pagos');
    expect(res.statusCode).toBe(401);
    expect(getPagos).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getPagos', async () => {
    const res = await request(app).get('/pagos').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getPagos).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/pagos').send({});
    expect(res.statusCode).toBe(401);
    expect(createPago).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/pagos').set(TOKEN).set('x-rol', 'Cliente').send({});
    expect(res.statusCode).toBe(403);
    expect(createPago).not.toHaveBeenCalled();
  });

  test('POST / con rol Caja llama a createPago', async () => {
    const res = await request(app)
      .post('/pagos').set(TOKEN).set('x-rol', 'Caja').send({ monto: 150 });
    expect(res.statusCode).toBe(201);
    expect(createPago).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createPago', async () => {
    const res = await request(app)
      .post('/pagos').set(TOKEN).set('x-rol', 'Admin').send({ monto: 150 });
    expect(res.statusCode).toBe(201);
  });

});