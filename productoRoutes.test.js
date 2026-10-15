import request from 'supertest';
import express from 'express';

// Simulamos los controladores (cada uno responde algo fijo)
jest.mock('../../controllers/productoController', () => ({
  getProductos: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createEntradaProducto: jest.fn((req, res) => res.status(201).json({ ok: true })),
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

import router from '../productoRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getProductos, createEntradaProducto,
} from '../../controllers/productoController';

// soloRol se llama al cargar el router; guardamos esas llamadas
// antes de que clearMocks las borre entre pruebas
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/productos', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - productoRoutes', () => {

  test('la ruta protegida se configura con roles Planillero y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Planillero', 'Admin'], // POST /entrada
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(401);
    expect(getProductos).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getProductos', async () => {
    const res = await request(app).get('/productos').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getProductos).toHaveBeenCalledTimes(1);
  });

  // ---------- POST /entrada ----------
  test('POST /entrada sin token responde 401', async () => {
    const res = await request(app).post('/productos/entrada').send({});
    expect(res.statusCode).toBe(401);
    expect(createEntradaProducto).not.toHaveBeenCalled();
  });

  test('POST /entrada con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/productos/entrada').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(createEntradaProducto).not.toHaveBeenCalled();
  });

  test('POST /entrada con rol Caja (no incluido) responde 403', async () => {
    const res = await request(app)
      .post('/productos/entrada').set(TOKEN).set('x-rol', 'Caja').send({});
    expect(res.statusCode).toBe(403);
    expect(createEntradaProducto).not.toHaveBeenCalled();
  });

  test('POST /entrada con rol Planillero llama a createEntradaProducto', async () => {
    const res = await request(app)
      .post('/productos/entrada').set(TOKEN).set('x-rol', 'Planillero').send({ cantidad: 10 });
    expect(res.statusCode).toBe(201);
    expect(createEntradaProducto).toHaveBeenCalledTimes(1);
  });

  test('POST /entrada con rol Admin llama a createEntradaProducto', async () => {
    const res = await request(app)
      .post('/productos/entrada').set(TOKEN).set('x-rol', 'Admin').send({ cantidad: 10 });
    expect(res.statusCode).toBe(201);
    expect(createEntradaProducto).toHaveBeenCalledTimes(1);
  });

  // ---------- Rutas no definidas ----------
  test('POST / (sin /entrada) no existe y responde 404', async () => {
    const res = await request(app)
      .post('/productos').set(TOKEN).set('x-rol', 'Admin').send({});
    expect(res.statusCode).toBe(404);
    expect(createEntradaProducto).not.toHaveBeenCalled();
  });

});