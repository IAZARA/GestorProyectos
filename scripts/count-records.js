const knex = require('knex');
const dbConfig = require('../config/database');

async function countRecords() {
  const pg = knex(dbConfig);
  
  try {
    const tables = ['users', 'projects', 'project_members', 'events', 'event_attendees', 'event_attachments', 'notifications'];
    
    for (const table of tables) {
      const count = await pg(table).count('* as count').first();
      console.log(`Tabla ${table}: ${count.count} registros`);
    }
  } catch (error) {
    console.error('Error al contar registros:', error);
  } finally {
    await pg.destroy();
  }
}

countRecords().catch(console.error);
