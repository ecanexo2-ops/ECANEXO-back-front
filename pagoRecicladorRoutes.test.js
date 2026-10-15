import request from 'supertest';
import express from 'express';

// Simulamos los controladores (cada uno responde algo fijo)
jest.mock('../../controllers/pagoRecicladorController', () => ({
  getPagosReciclador: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createPagoReciclador: jest.fn((req, res) => res.status(201).json({ ok: true })),
}), { virtual: true });

// Simulamos auth: sin header Authorization -> 401. soloRol revisa el header x-rol -> 403
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) =>
    req.headers.authorization ? next() : res.status(401).json({ error: 'No autorizado' })
  ),
  soloRol: jest.fn((...roles) => (req, res, next) =>
    roles.includes(req.headers['x-rol']) ? next() : res.status(403).json({ error: 'Prohibido' })
  ),
}), { virtual: true });

import router from '../pagoRecicladorRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getPagosReciclador, createPagoReciclador,
} from '../../controllers/pagoRecicladorController';

// soloRol se llama al cargar el router; guardamos esas llamadas
// antes de que clearMocks las borre entre pruebas
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/pagos-reciclador', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - pagoRecicladorRoutes', () => {

  test('la ruta protegida se configura con roles Planillero y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Planillero', 'Admin'], // POST
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/pagos-reciclador');
    expect(res.statusCode).toBe(401);
    expect(getPagosReciclador).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getPagosReciclador', async () => {
    const res = await request(app).get('/pagos-reciclador').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getPagosReciclador).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/pagos-reciclador').send({});
    expect(res.statusCode).toBe(401);
    expect(createPagoReciclador).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/pagos-reciclador').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(createPagoReciclador).not.toHaveBeenCalled();
  });

  test('POST / con rol Caja (no incluido) responde 403', async () => {
    const res = await request(app)
      .post('/pagos-reciclador').set(TOKEN).set('x-rol', 'Caja').send({});
    expect(res.statusCode).toBe(403);
    expect(createPagoReciclador).not.toHaveBeenCalled();
  });

  test('POST / con rol Planillero llama a createPagoReciclador', async () => {
    const res = await request(app)
      .post('/pagos-reciclador').set(TOKEN).set('x-rol', 'Planillero').send({ monto: 50 });
    expect(res.statusCode).toBe(201);
    expect(createPagoReciclador).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createPagoReciclador', async () => {
    const res = await request(app)
      .post('/pagos-reciclador').set(TOKEN).set('x-rol', 'Admin').send({ monto: 50 });
    expect(res.statusCode).toBe(201);
    expect(createPagoReciclador).toHaveBeenCalledTimes(1);
  });

});