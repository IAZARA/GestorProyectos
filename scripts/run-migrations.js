/**
 * Script para ejecutar las migraciones de PostgreSQL
 */

const knex = require('knex');
const dbConfig = require('../config/database');

async function runMigrations() {
  console.log('Ejecutando migraciones de PostgreSQL...');
  
  const pg = knex(dbConfig);
  
  try {
    // Verificar conexión a la base de datos
    await pg.raw('SELECT 1');
    console.log('Conexión a PostgreSQL establecida correctamente');
    
    // Ejecutar migraciones
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
    
  } catch (error) {
    console.error('Error al ejecutar migraciones:', error);
  } finally {
    await pg.destroy();
    console.log('Conexión cerrada');
  }
}

// Ejecutar migraciones
runMigrations().catch(console.error); 