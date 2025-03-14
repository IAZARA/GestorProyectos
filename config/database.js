/**
 * Configuración de la base de datos PostgreSQL
 */

const path = require('path');
require('dotenv').config();

module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gestionadcor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '', // La contraseña se configurará mediante variables de entorno
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, '../migrations')
  },
  seeds: {
    directory: '../seeds'
  }
}; 