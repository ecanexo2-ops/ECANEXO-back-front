import request from 'supertest';
import express from 'express';
import router from '../proveedores.js';

// Simulamos el módulo de la base de datos
jest.mock('../../db.js');
import pool from '../../db.js';

// Creamos una app de Express mínima solo para las pruebas
const app = express();
app.use(express.json());
app.use('/proveedores', router);

describe('Pruebas de Caja Blanca - Proveedores', () => {
  
  test('GET / sin búsqueda debe retornar lista paginada', async () => {
    // Configuramos el mock: 1ra llamada devuelve rows, 2da devuelve total
    pool.query
      .mockResolvedValueOnce([[{ documentoProveedor: '123', nombreProveedor: 'Test' }]])
      .mockResolvedValueOnce([[{ total: 10 }]]);

    const res = await request(app).get('/proveedores');

    expect(res.statusCode).toBe(200);
    expect(res.body.proveedores).toHaveLength(1);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('GET / con búsqueda debe construir query con WHERE', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await request(app).get('/proveedores?search=Juan');

    const queryEjecutada = pool.query.mock.calls[0][0];
    expect(queryEjecutada).toContain('WHERE');
    expect(queryEjecutada).toContain('nombreProveedor LIKE ?');
  });

  test('POST / debe rechazar si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/proveedores')
      .send({ nombreProveedor: 'Incompleto' });

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled(); // No debe tocar la BD
  });
});
