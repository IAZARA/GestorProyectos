/**
 * Script para verificar el estado de la migración y la integridad de los datos
 * Este script compara los datos en MongoDB y PostgreSQL para asegurar que la migración fue exitosa
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');

// Configuración de MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestionadcor';

// Configuración de PostgreSQL
const pgConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'gestionadcor',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
};

// Función para conectar a MongoDB
async function connectToMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('Conectado a MongoDB');
  return client.db();
}

// Función para conectar a PostgreSQL
async function connectToPg() {
  const pool = new Pool(pgConfig);
  console.log('Conectado a PostgreSQL');
  return pool;
}

// Función para obtener el recuento de documentos en MongoDB
async function getMongoCollectionCount(db, collectionName) {
  const collection = db.collection(collectionName);
  return await collection.countDocuments();
}

// Función para obtener el recuento de registros en PostgreSQL
async function getPgTableCount(pool, tableName) {
  const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
  return parseInt(result.rows[0].count, 10);
}

// Función para verificar la integridad de los datos
async function verifyDataIntegrity() {
  console.log('=== Verificando integridad de datos ===');
  
  let mongoDb = null;
  let pgPool = null;
  
  try {
    // Conectar a las bases de datos
    mongoDb = await connectToMongo();
    pgPool = await connectToPg();
    
    // Mapeo de colecciones de MongoDB a tablas de PostgreSQL
    const collectionMappings = [
      { mongo: 'users', pg: 'users' },
      { mongo: 'projects', pg: 'projects' },
      { mongo: 'events', pg: 'events' },
      { mongo: 'notifications', pg: 'notifications' }
    ];
    
    // Verificar el recuento de cada colección/tabla
    console.log('\nComparando recuentos de registros:');
    console.log('--------------------------------');
    console.log('Colección/Tabla | MongoDB | PostgreSQL | Diferencia');
    console.log('--------------------------------');
    
    let allMatch = true;
    
    for (const mapping of collectionMappings) {
      const mongoCount = await getMongoCollectionCount(mongoDb, mapping.mongo);
      const pgCount = await getPgTableCount(pgPool, mapping.pg);
      const difference = mongoCount - pgCount;
      const status = difference === 0 ? '✅ Coincide' : '❌ No coincide';
      
      console.log(`${mapping.mongo.padEnd(15)} | ${mongoCount.toString().padEnd(8)} | ${pgCount.toString().padEnd(11)} | ${difference} ${status}`);
      
      if (difference !== 0) {
        allMatch = false;
      }
    }
    
    console.log('--------------------------------');
    
    if (allMatch) {
      console.log('\n✅ Todos los recuentos coinciden. La migración parece ser exitosa.');
    } else {
      console.log('\n❌ Algunos recuentos no coinciden. Puede haber problemas con la migración.');
    }
    
    // Verificar algunos registros específicos
    console.log('\nVerificando registros específicos:');
    
    // Verificar usuarios
    const ivanMongo = await mongoDb.collection('users').findOne({ email: 'ivan@example.com' });
    const ivanPg = (await pgPool.query('SELECT * FROM users WHERE email = $1', ['ivan@example.com'])).rows[0];
    
    if (ivanMongo && ivanPg) {
      console.log(`✅ Usuario 'ivan@example.com' encontrado en ambas bases de datos.`);
      console.log(`   MongoDB ID: ${ivanMongo._id}`);
      console.log(`   PostgreSQL ID: ${ivanPg.id}`);
    } else {
      console.log(`❌ Usuario 'ivan@example.com' no encontrado en ambas bases de datos.`);
    }
    
    // Verificar proyectos
    const projectCount = await getPgTableCount(pgPool, 'projects');
    console.log(`\nProyectos en PostgreSQL: ${projectCount}`);
    
    if (projectCount > 0) {
      const sampleProject = (await pgPool.query('SELECT * FROM projects LIMIT 1')).rows[0];
      console.log(`✅ Proyecto de muestra: ${sampleProject.name}`);
      
      // Verificar miembros del proyecto
      const memberCount = (await pgPool.query('SELECT COUNT(*) FROM project_members WHERE project_id = $1', [sampleProject.id])).rows[0].count;
      console.log(`   Miembros del proyecto: ${memberCount}`);
    }
    
    // Verificar eventos
    const eventCount = await getPgTableCount(pgPool, 'events');
    console.log(`\nEventos en PostgreSQL: ${eventCount}`);
    
    if (eventCount > 0) {
      const sampleEvent = (await pgPool.query('SELECT * FROM events LIMIT 1')).rows[0];
      console.log(`✅ Evento de muestra: ${sampleEvent.title}`);
      
      // Verificar asistentes al evento
      const attendeeCount = (await pgPool.query('SELECT COUNT(*) FROM event_attendees WHERE event_id = $1', [sampleEvent.id])).rows[0].count;
      console.log(`   Asistentes al evento: ${attendeeCount}`);
    }
    
    // Verificar notificaciones
    const notificationCount = await getPgTableCount(pgPool, 'notifications');
    console.log(`\nNotificaciones en PostgreSQL: ${notificationCount}`);
    
    if (notificationCount > 0) {
      const sampleNotification = (await pgPool.query('SELECT * FROM notifications LIMIT 1')).rows[0];
      console.log(`✅ Notificación de muestra: ${sampleNotification.content}`);
      console.log(`   De: ${sampleNotification.from_id}`);
      console.log(`   Para: ${sampleNotification.to_id}`);
    }
    
    console.log('\n=== Verificación completada ===');
  } catch (error) {
    console.error('Error durante la verificación:', error);
  } finally {
    // Cerrar conexiones
    if (mongoDb) {
      const client = mongoDb.client;
      await client.close();
      console.log('Conexión a MongoDB cerrada');
    }
    
    if (pgPool) {
      await pgPool.end();
      console.log('Conexión a PostgreSQL cerrada');
    }
  }
}

// Ejecutar la verificación
verifyDataIntegrity().catch(console.error); 