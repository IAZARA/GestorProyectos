/**
 * Script para inicializar la base de datos PostgreSQL
 * Este script crea la base de datos y ejecuta las migraciones
 */

const { Client } = require('pg');
const knex = require('knex');
const dbConfig = require('../config/database');
require('dotenv').config();

async function initializeDatabase() {
  console.log('Iniciando inicialización de la base de datos PostgreSQL...');
  
  // Conectar a PostgreSQL para crear la base de datos si no existe
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres' // Base de datos por defecto
  });
  
  try {
    await client.connect();
    console.log('Conectado a PostgreSQL');
    
    // Verificar si la base de datos existe
    const dbName = process.env.DB_NAME || 'gestionadcor';
    const checkDbResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (checkDbResult.rowCount === 0) {
      console.log(`La base de datos '${dbName}' no existe, creándola...`);
      
      // Crear la base de datos
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Base de datos '${dbName}' creada correctamente`);
    } else {
      console.log(`La base de datos '${dbName}' ya existe`);
    }
    
    // Cerrar conexión
    await client.end();
    
    // Conectar a la base de datos creada y ejecutar migraciones
    const pg = knex(dbConfig);
    
    try {
      // Ejecutar migraciones
      console.log('Ejecutando migraciones...');
      await pg.migrate.latest();
      console.log('Migraciones ejecutadas correctamente');
      
      // Verificar tablas creadas
      const tables = await pg.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('\nTablas creadas en la base de datos:');
      tables.rows.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
      
      console.log('\nBase de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al ejecutar migraciones:', error);
    } finally {
      await pg.destroy();
    }
    
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

// Ejecutar inicialización
initializeDatabase().catch(console.error); 