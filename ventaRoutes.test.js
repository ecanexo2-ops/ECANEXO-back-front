import request from 'supertest';
import express from 'express';

// Simulamos los controladores (cada uno responde algo fijo)
jest.mock('../../controllers/ventaController', () => ({
  getVentas: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createVenta: jest.fn((req, res) => res.status(201).json({ ok: true })),
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

import router from '../ventaRoutes.js';
import { soloRol } from '../../middlewares/auth';
import { getVentas, createVenta } from '../../controllers/ventaController';

// soloRol se llama al cargar el router; guardamos esas llamadas
// antes de que clearMocks las borre entre pruebas
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/ventas', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - ventaRoutes', () => {

  test('la ruta protegida se configura con roles Caja y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Caja', 'Admin'], // POST
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/ventas');
    expect(res.statusCode).toBe(401);
    expect(getVentas).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getVentas', async () => {
    const res = await request(app).get('/ventas').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getVentas).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/ventas').send({});
    expect(res.statusCode).toBe(401);
    expect(createVenta).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/ventas').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(createVenta).not.toHaveBeenCalled();
  });

  test('POST / con rol Caja llama a createVenta', async () => {
    const res = await request(app)
      .post('/ventas').set(TOKEN).set('x-rol', 'Caja').send({ total: 100 });
    expect(res.statusCode).toBe(201);
    expect(createVenta).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createVenta', async () => {
    const res = await request(app)
      .post('/ventas').set(TOKEN).set('x-rol', 'Admin').send({ total: 100 });
    expect(res.statusCode).toBe(201);
  });

});