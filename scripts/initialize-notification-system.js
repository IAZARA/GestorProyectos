/**
 * Script para inicializar el sistema de notificaciones
 * Este script verifica y configura todo lo necesario para que las notificaciones funcionen correctamente
 */

const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// IDs correctos de los usuarios
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Configuración de la base de datos
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'gestionadcor';

// Función para verificar y corregir la configuración del sistema de notificaciones
async function main() {
  console.log('Iniciando verificación del sistema de notificaciones...');
  
  // Conectar a MongoDB
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const notificationsCollection = db.collection('notifications');
    const projectsCollection = db.collection('projects');
    const eventsCollection = db.collection('events');
    
    // 1. Verificar que los usuarios existen
    console.log('\n1. Verificando usuarios...');
    const ivan = await usersCollection.findOne({ id: IVAN_ID });
    const maxi = await usersCollection.findOne({ id: MAXI_ID });
    
    if (!ivan) {
      console.error(`Usuario Iván (ID: ${IVAN_ID}) no encontrado en la base de datos`);
      return;
    }
    
    if (!maxi) {
      console.error(`Usuario Maxi (ID: ${MAXI_ID}) no encontrado en la base de datos`);
      return;
    }
    
    console.log(`Usuario Iván encontrado: ${ivan.firstName} ${ivan.lastName}`);
    console.log(`Usuario Maxi encontrado: ${maxi.firstName} ${maxi.lastName}`);
    
    // 2. Verificar notificaciones existentes
    console.log('\n2. Verificando notificaciones existentes...');
    const existingNotifications = await notificationsCollection.find({}).toArray();
    console.log(`Total de notificaciones en la base de datos: ${existingNotifications.length}`);
    
    // Mostrar notificaciones por usuario
    const ivanNotifications = existingNotifications.filter(n => n.toId === IVAN_ID);
    const maxiNotifications = existingNotifications.filter(n => n.toId === MAXI_ID);
    
    console.log(`Notificaciones para Iván: ${ivanNotifications.length}`);
    console.log(`Notificaciones para Maxi: ${maxiNotifications.length}`);
    
    // 3. Verificar proyectos y eventos
    console.log('\n3. Verificando proyectos y eventos...');
    const projects = await projectsCollection.find({}).toArray();
    console.log(`Total de proyectos en la base de datos: ${projects.length}`);
    
    const events = await eventsCollection.find({}).toArray();
    console.log(`Total de eventos en la base de datos: ${events.length}`);
    
    // 4. Crear un proyecto de prueba si no existe ninguno
    let testProject = projects.length > 0 ? projects[0] : null;
    
    if (!testProject) {
      console.log('No se encontró ningún proyecto, creando uno nuevo...');
      testProject = {
        id: uuidv4(),
        name: 'Proyecto de Prueba',
        description: 'Proyecto creado para probar las notificaciones',
        members: [IVAN_ID, MAXI_ID],
        createdBy: IVAN_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await projectsCollection.insertOne(testProject);
      console.log(`Proyecto creado con ID: ${testProject.id}`);
    } else {
      console.log(`Proyecto encontrado: ${testProject.name} (ID: ${testProject.id})`);
      
      // Asegurarse de que ambos usuarios son miembros del proyecto
      if (!testProject.members || !Array.isArray(testProject.members)) {
        testProject.members = [IVAN_ID, MAXI_ID];
        await projectsCollection.updateOne(
          { id: testProject.id },
          { $set: { members: testProject.members } }
        );
        console.log('Miembros del proyecto actualizados');
      } else if (!testProject.members.includes(IVAN_ID) || !testProject.members.includes(MAXI_ID)) {
        if (!testProject.members.includes(IVAN_ID)) testProject.members.push(IVAN_ID);
        if (!testProject.members.includes(MAXI_ID)) testProject.members.push(MAXI_ID);
        
        await projectsCollection.updateOne(
          { id: testProject.id },
          { $set: { members: testProject.members } }
        );
        console.log('Miembros del proyecto actualizados');
      }
    }
    
    // 5. Crear un evento de prueba
    console.log('\n5. Creando evento de prueba...');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const eventId = uuidv4();
    const event = {
      id: eventId,
      title: 'Reunión de prueba del sistema de notificaciones',
      description: 'Evento creado para probar el sistema de notificaciones',
      startDate: tomorrow,
      endDate: tomorrow,
      createdBy: IVAN_ID,
      createdAt: now,
      updatedAt: now,
      type: 'meeting',
      projectId: testProject.id,
      attendees: [IVAN_ID, MAXI_ID],
      attachments: [],
      color: '#4f46e5' // Indigo
    };
    
    // Guardar el evento en la base de datos
    await eventsCollection.insertOne(event);
    console.log(`Evento creado con ID: ${eventId}`);
    
    // 6. Crear notificaciones de prueba
    console.log('\n6. Creando notificaciones de prueba...');
    
    // Notificación de Iván para Maxi
    const notificationFromIvanToMaxi = {
      id: uuidv4(),
      type: 'event_added',
      content: `${ivan.firstName} ${ivan.lastName} ha añadido un evento "${event.title}" al calendario del proyecto "${testProject.name}"`,
      fromId: IVAN_ID,
      toId: MAXI_ID,
      read: false,
      createdAt: now,
      updatedAt: now
    };
    
    await notificationsCollection.insertOne(notificationFromIvanToMaxi);
    console.log(`Notificación de Iván para Maxi creada con ID: ${notificationFromIvanToMaxi.id}`);
    
    // Notificación de Maxi para Iván
    const notificationFromMaxiToIvan = {
      id: uuidv4(),
      type: 'comment_added',
      content: `${maxi.firstName} ${maxi.lastName} ha comentado en el evento "${event.title}"`,
      fromId: MAXI_ID,
      toId: IVAN_ID,
      read: false,
      createdAt: now,
      updatedAt: now
    };
    
    await notificationsCollection.insertOne(notificationFromMaxiToIvan);
    console.log(`Notificación de Maxi para Iván creada con ID: ${notificationFromMaxiToIvan.id}`);
    
    // 7. Verificar las notificaciones finales
    console.log('\n7. Verificando notificaciones finales...');
    const finalNotifications = await notificationsCollection.find({}).toArray();
    console.log(`Total de notificaciones en la base de datos: ${finalNotifications.length}`);
    
    // Mostrar notificaciones por usuario
    const finalIvanNotifications = finalNotifications.filter(n => n.toId === IVAN_ID);
    const finalMaxiNotifications = finalNotifications.filter(n => n.toId === MAXI_ID);
    
    console.log(`Notificaciones para Iván: ${finalIvanNotifications.length}`);
    finalIvanNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.content} (Leída: ${notif.read ? 'Sí' : 'No'}, Creada: ${notif.createdAt})`);
    });
    
    console.log(`Notificaciones para Maxi: ${finalMaxiNotifications.length}`);
    finalMaxiNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.content} (Leída: ${notif.read ? 'Sí' : 'No'}, Creada: ${notif.createdAt})`);
    });
    
    console.log('\nInicialización del sistema de notificaciones completada con éxito');
    client.close();
    
  } catch (error) {
    console.error('Error:', error);
    client.close();
  }
}

main().catch(console.error); 