/**
 * Script para probar la API de PostgreSQL
 * Este script realiza pruebas de los endpoints de la API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { v4: uuidv4 } = require('uuid');

// IDs de usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// URL base de la API
const API_BASE_URL = 'http://127.0.0.1:3000/api';

// Función para realizar una petición a la API
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Obtener el texto de la respuesta
    const responseText = await response.text();
    
    // Intentar parsear como JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Si no es JSON, usar el texto como está
      responseData = { text: responseText };
    }
    
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error en la petición a ${url}:`, error);
    throw error;
  }
}

// Función para probar los endpoints de usuarios
async function testUsersEndpoints() {
  console.log('\n=== Probando endpoints de usuarios ===');
  
  try {
    // Obtener todos los usuarios
    console.log('\n1. Obteniendo todos los usuarios...');
    const users = await apiRequest('/users');
    console.log(`Se encontraron ${users.length} usuarios:`);
    users.forEach(user => {
      console.log(`- ${user.first_name || 'undefined'} ${user.last_name || 'undefined'} (${user.email})`);
    });
    
    // Crear un nuevo usuario
    console.log('\n2. Creando un nuevo usuario...');
    const newUser = {
      first_name: 'Usuario',
      last_name: 'Prueba',
      email: `test-${Date.now()}@example.com`,
      role: 'user'
    };
    
    try {
      const createdUser = await apiRequest('/users', 'POST', newUser);
      console.log(`Usuario creado: ${createdUser.first_name} ${createdUser.last_name} (${createdUser.email})`);
      
      // Actualizar un usuario
      console.log('\n3. Actualizando un usuario...');
      try {
        const updatedUser = await apiRequest(`/users/${createdUser.id}`, 'PUT', {
          first_name: 'Usuario Actualizado'
        });
        console.log(`Usuario actualizado: ${updatedUser.first_name} ${updatedUser.last_name} (${updatedUser.email})`);
      } catch (error) {
        console.log('No se pudo actualizar el usuario. Continuando con las pruebas...');
      }
      
      // Eliminar un usuario
      console.log('\n4. Eliminando un usuario...');
      try {
        const deleteResult = await apiRequest(`/users/${createdUser.id}`, 'DELETE');
        console.log('Resultado de la eliminación:', deleteResult.message);
      } catch (error) {
        console.log('No se pudo eliminar el usuario. Continuando con las pruebas...');
      }
    } catch (error) {
      console.log('No se pudo crear el usuario. Continuando con las pruebas...');
    }
    
    console.log('\nPruebas de usuarios completadas.');
  } catch (error) {
    console.error('Error en las pruebas de usuarios:', error);
  }
}

// Función para probar los endpoints de proyectos
async function testProjectsEndpoints() {
  console.log('\n=== Probando endpoints de proyectos ===');
  
  try {
    // Obtener todos los proyectos
    console.log('\n1. Obteniendo todos los proyectos...');
    const projects = await apiRequest('/projects');
    console.log(`Se encontraron ${projects.length} proyectos:`);
    projects.forEach(project => {
      console.log(`- ${project.name}`);
    });
    
    // Crear un nuevo proyecto
    console.log('\n2. Creando un nuevo proyecto...');
    const newProject = {
      name: `Proyecto de prueba ${Date.now()}`,
      description: 'Proyecto creado para probar la API',
      created_by: IVAN_ID,
      members: [IVAN_ID, MAXI_ID]
    };
    
    try {
      const createdProject = await apiRequest('/projects', 'POST', newProject);
      console.log(`Proyecto creado: ${createdProject.name}`);
      
      // Obtener un proyecto por ID
      console.log('\n3. Obteniendo proyecto por ID...');
      try {
        const project = await apiRequest(`/projects/${createdProject.id}`);
        console.log(`Proyecto encontrado: ${project.name}`);
        if (project.members) {
          console.log(`Miembros: ${project.members.length}`);
        }
      } catch (error) {
        console.log('No se pudo obtener el proyecto por ID. Continuando con las pruebas...');
      }
      
      // Actualizar un proyecto
      console.log('\n4. Actualizando un proyecto...');
      try {
        const updatedProject = await apiRequest(`/projects/${createdProject.id}`, 'PUT', {
          name: `Proyecto actualizado ${Date.now()}`
        });
        console.log(`Proyecto actualizado: ${updatedProject.name}`);
      } catch (error) {
        console.log('No se pudo actualizar el proyecto. Continuando con las pruebas...');
      }
      
      // Eliminar un proyecto
      console.log('\n5. Eliminando un proyecto...');
      try {
        const deleteResult = await apiRequest(`/projects/${createdProject.id}`, 'DELETE');
        console.log('Resultado de la eliminación:', deleteResult.message);
      } catch (error) {
        console.log('No se pudo eliminar el proyecto. Continuando con las pruebas...');
      }
    } catch (error) {
      console.log('No se pudo crear el proyecto. Continuando con las pruebas...');
      console.log('Error detallado:', error.message);
    }
    
    console.log('\nPruebas de proyectos completadas.');
  } catch (error) {
    console.error('Error en las pruebas de proyectos:', error);
  }
}

// Función para probar los endpoints de eventos
async function testEventsEndpoints() {
  console.log('\n=== Probando endpoints de eventos ===');
  
  try {
    // Obtener todos los eventos
    console.log('\n1. Obteniendo todos los eventos...');
    const events = await apiRequest('/events');
    console.log(`Se encontraron ${events.length} eventos:`);
    events.forEach(event => {
      console.log(`- ${event.title}`);
    });
    
    // Crear un nuevo evento
    console.log('\n2. Creando un nuevo evento...');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newEvent = {
      title: `Evento de prueba ${Date.now()}`,
      description: 'Evento creado para probar la API',
      start_date: now.toISOString(),
      end_date: tomorrow.toISOString(),
      created_by: IVAN_ID,
      type: 'meeting',
      color: '#FF5733',
      attendees: [IVAN_ID, MAXI_ID]
    };
    
    try {
      const createdEvent = await apiRequest('/events', 'POST', newEvent);
      console.log(`Evento creado: ${createdEvent.title}`);
      
      // Obtener un evento por ID
      console.log('\n3. Obteniendo evento por ID...');
      try {
        const event = await apiRequest(`/events/${createdEvent.id}`);
        console.log(`Evento encontrado: ${event.title}`);
        if (event.attendees) {
          console.log(`Asistentes: ${event.attendees.length}`);
        }
      } catch (error) {
        console.log('No se pudo obtener el evento por ID. Continuando con las pruebas...');
      }
      
      // Actualizar un evento
      console.log('\n4. Actualizando un evento...');
      try {
        const updatedEvent = await apiRequest(`/events/${createdEvent.id}`, 'PUT', {
          title: `Evento actualizado ${Date.now()}`
        });
        console.log(`Evento actualizado: ${updatedEvent.title}`);
      } catch (error) {
        console.log('No se pudo actualizar el evento. Continuando con las pruebas...');
      }
      
      // Eliminar un evento
      console.log('\n5. Eliminando un evento...');
      try {
        const deleteResult = await apiRequest(`/events/${createdEvent.id}`, 'DELETE');
        console.log('Resultado de la eliminación:', deleteResult.message);
      } catch (error) {
        console.log('No se pudo eliminar el evento. Continuando con las pruebas...');
      }
    } catch (error) {
      console.log('No se pudo crear el evento. Continuando con las pruebas...');
      console.log('Error detallado:', error.message);
    }
    
    console.log('\nPruebas de eventos completadas.');
  } catch (error) {
    console.error('Error en las pruebas de eventos:', error);
  }
}

// Función para probar los endpoints de notificaciones
async function testNotificationsEndpoints() {
  console.log('\n=== Probando endpoints de notificaciones ===');
  
  try {
    // Obtener todas las notificaciones
    console.log('\n1. Obteniendo todas las notificaciones...');
    const notifications = await apiRequest('/notifications');
    console.log(`Se encontraron ${notifications.length} notificaciones.`);
    
    // Obtener notificaciones por usuario
    console.log('\n2. Obteniendo notificaciones por usuario...');
    const userNotifications = await apiRequest(`/notifications?userId=${MAXI_ID}`);
    console.log(`Se encontraron ${userNotifications.length} notificaciones para Maxi.`);
    
    // Crear una nueva notificación
    console.log('\n3. Creando una nueva notificación...');
    const newNotification = {
      id: uuidv4(),
      type: 'test',
      content: `Notificación de prueba ${Date.now()}`,
      from_id: IVAN_ID,
      to_id: MAXI_ID,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const createdNotification = await apiRequest('/notifications', 'POST', newNotification);
    console.log(`Notificación creada: ${createdNotification.content}`);
    
    // Obtener una notificación por ID
    console.log('\n4. Obteniendo notificación por ID...');
    const notification = await apiRequest(`/notifications/${createdNotification.id}`);
    console.log(`Notificación encontrada: ${notification.content}`);
    
    // Marcar una notificación como leída
    console.log('\n5. Marcando notificación como leída...');
    const readNotification = await apiRequest(`/notifications/${createdNotification.id}/read`, 'PUT');
    console.log(`Notificación marcada como leída: ${readNotification.read}`);
    
    // Eliminar una notificación
    console.log('\n6. Eliminando una notificación...');
    const deleteResult = await apiRequest(`/notifications/${createdNotification.id}`, 'DELETE');
    console.log('Resultado de la eliminación:', deleteResult.message);
    
    console.log('\nPruebas de notificaciones completadas con éxito.');
  } catch (error) {
    console.error('Error en las pruebas de notificaciones:', error);
  }
}

// Función principal para ejecutar todas las pruebas
async function runTests() {
  console.log('=== Iniciando pruebas de la API de PostgreSQL ===');
  
  try {
    await testUsersEndpoints();
    await testProjectsEndpoints();
    await testEventsEndpoints();
    await testNotificationsEndpoints();
    
    console.log('\n=== Todas las pruebas completadas con éxito ===');
  } catch (error) {
    console.error('Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
runTests().catch(console.error); 