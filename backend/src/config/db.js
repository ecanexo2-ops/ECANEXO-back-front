// Forzamos a dotenv a leer backend/.env sin importar
// desde dónde se ejecute el proceso (api/ lo requiere como librería).
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../backend/.env') })
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             process.env.DB_PORT     || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'ecanexo',
  waitForConnections: true,
  connectionLimit:  10,
})

module.exports = pool