/**
 * Script para migrar datos de MongoDB a PostgreSQL
 * Este script extrae los datos de MongoDB y los inserta en PostgreSQL
 */

const { MongoClient } = require('mongodb');
const knex = require('knex');
const dbConfig = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Configuración de MongoDB
const MONGO_URI = 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'gestionadcor';

// IDs conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Inicializar conexión a PostgreSQL
const pg = knex(dbConfig);

async function migrateData() {
  console.log('Iniciando migración de datos de MongoDB a PostgreSQL...');
  
  // Conectar a MongoDB
  const mongoClient = new MongoClient(MONGO_URI);
  try {
    await mongoClient.connect();
    console.log('Conectado a MongoDB');
    
    const mongoDB = mongoClient.db(MONGO_DB_NAME);
    
    // 1. Migrar usuarios
    console.log('\n1. Migrando usuarios...');
    const usersCollection = mongoDB.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    if (users.length > 0) {
      // Limpiar tabla de usuarios en PostgreSQL
      await pg('users').del();
      
      // Insertar usuarios en PostgreSQL
      for (const user of users) {
        await pg('users').insert({
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          role: user.role,
          created_at: user.createdAt || new Date(),
          updated_at: user.updatedAt || new Date()
        });
      }
      
      console.log(`Migrados ${users.length} usuarios`);
    } else {
      console.log('No se encontraron usuarios para migrar');
      
      // Crear usuarios por defecto si no existen
      await pg('users').insert([
        {
          id: IVAN_ID,
          first_name: 'Iván',
          last_name: 'Zarate',
          email: 'ivan@example.com',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: MAXI_ID,
          first_name: 'Maxi',
          last_name: 'Scarimbolo',
          email: 'maxi@example.com',
          role: 'user',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      
      console.log('Creados usuarios por defecto: Iván y Maxi');
    }
    
    // 2. Migrar proyectos
    console.log('\n2. Migrando proyectos...');
    const projectsCollection = mongoDB.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    
    if (projects.length > 0) {
      // Limpiar tabla de proyectos en PostgreSQL
      await pg('projects').del();
      
      // Insertar proyectos en PostgreSQL
      for (const project of projects) {
        await pg('projects').insert({
          id: project.id,
          name: project.name,
          description: project.description,
          created_by: project.createdBy,
          created_at: project.createdAt || new Date(),
          updated_at: project.updatedAt || new Date()
        });
        
        // Insertar miembros del proyecto
        if (project.members && Array.isArray(project.members)) {
          for (const memberId of project.members) {
            await pg('project_members').insert({
              project_id: project.id,
              user_id: memberId
            });
          }
        }
      }
      
      console.log(`Migrados ${projects.length} proyectos`);
    } else {
      console.log('No se encontraron proyectos para migrar');
      
      // Crear un proyecto por defecto si no existe ninguno
      const defaultProjectId = uuidv4();
      await pg('projects').insert({
        id: defaultProjectId,
        name: 'Proyecto de Prueba',
        description: 'Proyecto creado para probar el sistema',
        created_by: IVAN_ID,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Añadir miembros al proyecto por defecto
      await pg('project_members').insert([
        { project_id: defaultProjectId, user_id: IVAN_ID },
        { project_id: defaultProjectId, user_id: MAXI_ID }
      ]);
      
      console.log('Creado proyecto por defecto con Iván y Maxi como miembros');
    }
    
    // 3. Migrar eventos
    console.log('\n3. Migrando eventos...');
    const eventsCollection = mongoDB.collection('events');
    const events = await eventsCollection.find({}).toArray();
    
    if (events.length > 0) {
      // Limpiar tabla de eventos en PostgreSQL
      await pg('events').del();
      
      // Insertar eventos en PostgreSQL
      for (const event of events) {
        await pg('events').insert({
          id: event.id,
          title: event.title,
          description: event.description,
          start_date: event.startDate,
          end_date: event.endDate,
          created_by: event.createdBy,
          project_id: event.projectId,
          type: event.type,
          color: event.color,
          created_at: event.createdAt || new Date(),
          updated_at: event.updatedAt || new Date()
        });
        
        // Insertar asistentes al evento
        if (event.attendees && Array.isArray(event.attendees)) {
          for (const attendeeId of event.attendees) {
            await pg('event_attendees').insert({
              event_id: event.id,
              user_id: attendeeId
            });
          }
        }
        
        // Insertar adjuntos del evento
        if (event.attachments && Array.isArray(event.attachments)) {
          for (const attachment of event.attachments) {
            await pg('event_attachments').insert({
              id: attachment.id,
              event_id: event.id,
              name: attachment.name,
              file_path: attachment.filePath,
              file_type: attachment.fileType,
              file_size: attachment.fileSize,
              uploaded_at: attachment.uploadedAt || new Date()
            });
          }
        }
      }
      
      console.log(`Migrados ${events.length} eventos`);
    } else {
      console.log('No se encontraron eventos para migrar');
    }
    
    // 4. Migrar notificaciones
    console.log('\n4. Migrando notificaciones...');
    const notificationsCollection = mongoDB.collection('notifications');
    const notifications = await notificationsCollection.find({}).toArray();
    
    if (notifications.length > 0) {
      // Limpiar tabla de notificaciones en PostgreSQL
      await pg('notifications').del();
      
      // Insertar notificaciones en PostgreSQL
      for (const notification of notifications) {
        await pg('notifications').insert({
          id: notification.id || uuidv4(),
          type: notification.type,
          content: notification.content,
          from_id: notification.fromId,
          to_id: notification.toId,
          read: notification.read || false,
          created_at: notification.createdAt || new Date(),
          updated_at: notification.updatedAt || new Date()
        });
      }
      
      console.log(`Migradas ${notifications.length} notificaciones`);
    } else {
      console.log('No se encontraron notificaciones para migrar');
    }
    
    console.log('\nMigración completada con éxito');
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar conexiones
    await mongoClient.close();
    await pg.destroy();
    console.log('Conexiones cerradas');
  }
}

// Ejecutar la migración
migrateData().catch(console.error); 