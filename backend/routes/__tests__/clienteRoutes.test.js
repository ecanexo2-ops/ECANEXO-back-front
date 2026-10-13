import request from 'supertest';
import express from 'express';

// Simulamos los controladores (cada uno responde algo fijo)
jest.mock('../../controllers/clienteController', () => ({
  getClientes: jest.fn((req, res) => res.status(200).json([{ id: 1 }])),
  createCliente: jest.fn((req, res) => res.status(201).json({ ok: true })),
  updateCliente: jest.fn((req, res) => res.status(200).json({ ok: true })),
  deleteCliente: jest.fn((req, res) => res.status(200).json({ ok: true })),
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

import router from '../clienteRoutes.js';
import { soloRol } from '../../middlewares/auth';
import {
  getClientes, createCliente, updateCliente, deleteCliente,
} from '../../controllers/clienteController';

// soloRol se llama al cargar el router; guardamos esas llamadas
// antes de que clearMocks las borre entre pruebas
const llamadasSoloRol = [...soloRol.mock.calls];

const app = express();
app.use(express.json());
app.use('/clientes', router);

const TOKEN = { Authorization: 'Bearer abc' };

describe('Pruebas de Caja Blanca - clienteRoutes', () => {

  test('las rutas protegidas se configuran con roles Caja y Admin', () => {
    expect(llamadasSoloRol).toEqual([
      ['Caja', 'Admin'], // POST
      ['Caja', 'Admin'], // PUT
      ['Caja', 'Admin'], // DELETE
    ]);
  });

  // ---------- GET / ----------
  test('GET / sin token responde 401 y no llega al controlador', async () => {
    const res = await request(app).get('/clientes');
    expect(res.statusCode).toBe(401);
    expect(getClientes).not.toHaveBeenCalled();
  });

  test('GET / con token llama a getClientes', async () => {
    const res = await request(app).get('/clientes').set(TOKEN);
    expect(res.statusCode).toBe(200);
    expect(getClientes).toHaveBeenCalledTimes(1);
  });

  // ---------- POST / ----------
  test('POST / sin token responde 401', async () => {
    const res = await request(app).post('/clientes').send({});
    expect(res.statusCode).toBe(401);
    expect(createCliente).not.toHaveBeenCalled();
  });

  test('POST / con rol no permitido responde 403', async () => {
    const res = await request(app)
      .post('/clientes').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(createCliente).not.toHaveBeenCalled();
  });

  test('POST / con rol Caja llama a createCliente', async () => {
    const res = await request(app)
      .post('/clientes').set(TOKEN).set('x-rol', 'Caja').send({ nombre: 'Ana' });
    expect(res.statusCode).toBe(201);
    expect(createCliente).toHaveBeenCalledTimes(1);
  });

  test('POST / con rol Admin llama a createCliente', async () => {
    const res = await request(app)
      .post('/clientes').set(TOKEN).set('x-rol', 'Admin').send({ nombre: 'Ana' });
    expect(res.statusCode).toBe(201);
  });

  // ---------- PUT /:id ----------
  test('PUT /:id con rol no permitido responde 403', async () => {
    const res = await request(app)
      .put('/clientes/5').set(TOKEN).set('x-rol', 'Lector').send({});
    expect(res.statusCode).toBe(403);
    expect(updateCliente).not.toHaveBeenCalled();
  });

  test('PUT /:id con rol Caja llama a updateCliente con el id', async () => {
    const res = await request(app)
      .put('/clientes/5').set(TOKEN).set('x-rol', 'Caja').send({ nombre: 'Luis' });
    expect(res.statusCode).toBe(200);
    expect(updateCliente.mock.calls[0][0].params.id).toBe('5');
  });

  // ---------- DELETE /:id ----------
  test('DELETE /:id sin token responde 401', async () => {
    const res = await request(app).delete('/clientes/5');
    expect(res.statusCode).toBe(401);
    expect(deleteCliente).not.toHaveBeenCalled();
  });

  test('DELETE /:id con rol Admin llama a deleteCliente', async () => {
    const res = await request(app)
      .delete('/clientes/5').set(TOKEN).set('x-rol', 'Admin');
    expect(res.statusCode).toBe(200);
    expect(deleteCliente).toHaveBeenCalledTimes(1);
  });

});