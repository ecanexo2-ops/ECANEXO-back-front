import request from 'supertest';
import express from 'express';

// Simulamos los controladores (cada uno responde algo fijo)
jest.mock('../../controllers/recicladorController', () => ({
  getRecicladores: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createReciclador: jest.fn((req, res) => res.status(201).json({ ok: true })),
  deleteReciclador: jest.fn((req, res) => res.status(200).json({ ok: true })),
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

import router from '../recicladorRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getRecicladores, createReciclador, deleteReciclador,
} from '../../controllers/recicladorController';

// soloRol se llama al cargar el router; guardamos esas llamadas
// antes de que clearMocks las borre entre pruebas
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/recicladores', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - recicladorRoutes', () => {

  test('las rutas protegidas se configuran con roles Planillero y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Planillero', 'Admin'], // POST
      ['Planillero', 'Admin'], // DELETE
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/recicladores');
    expect(res.statusCode).toBe(401);
    expect(getRecicladores).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getRecicladores', async () => {
    const res = await request(app).get('/recicladores').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getRecicladores).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/recicladores').send({});
    expect(res.statusCode).toBe(401);
    expect(createReciclador).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/recicladores').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(createReciclador).not.toHaveBeenCalled();
  });

  test('POST / con rol Planillero llama a createReciclador', async () => {
    const res = await request(app)
      .post('/recicladores').set(TOKEN).set('x-rol', 'Planillero').send({ nombre: 'Ana' });
    expect(res.statusCode).toBe(201);
    expect(createReciclador).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createReciclador', async () => {
    const res = await request(app)
      .post('/recicladores').set(TOKEN).set('x-rol', 'Admin').send({ nombre: 'Ana' });
    expect(res.statusCode).toBe(201);
  });

  // ---------- DELETE /:id ----------
  test('DELETE /:id sin token responde 401', async () => {
    const res = await request(app).delete('/recicladores/5');
    expect(res.statusCode).toBe(401);
    expect(deleteReciclador).not.toHaveBeenCalled();
  });

  test('DELETE /:id con rol no permitido responde 403', async () => {
    const res = await request(app)
      .delete('/recicladores/5').set(TOKEN).set('x-rol', 'Lector');
    expect(res.statusCode).toBe(403);
    expect(deleteReciclador).not.toHaveBeenCalled();
  });

  test('DELETE /:id con rol Planillero llama a deleteReciclador con el id', async () => {
    const res = await request(app)
      .delete('/recicladores/5').set(TOKEN).set('x-rol', 'Planillero');
    expect(res.statusCode).toBe(200);
    expect(deleteReciclador.mock.calls[0][0].params.id).toBe('5');
  });

});