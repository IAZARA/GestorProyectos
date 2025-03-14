/**
 * Script para probar el sistema de notificaciones
 * Este script envía notificaciones de prueba entre los usuarios existentes
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

// Función para probar las notificaciones
async function testNotifications() {
  console.log('=== Iniciando pruebas de notificaciones ===');
  
  try {
    // Obtener todas las notificaciones
    console.log('\n1. Obteniendo todas las notificaciones...');
    const notifications = await apiRequest('/notifications');
    console.log(`Se encontraron ${notifications.length} notificaciones.`);
    
    // Obtener notificaciones por usuario
    console.log('\n2. Obteniendo notificaciones para Iván...');
    const ivanNotifications = await apiRequest(`/notifications?userId=${IVAN_ID}`);
    console.log(`Se encontraron ${ivanNotifications.length} notificaciones para Iván.`);
    
    console.log('\n3. Obteniendo notificaciones para Maxi...');
    const maxiNotifications = await apiRequest(`/notifications?userId=${MAXI_ID}`);
    console.log(`Se encontraron ${maxiNotifications.length} notificaciones para Maxi.`);
    
    // Crear una nueva notificación de Iván para Maxi
    console.log('\n4. Creando una notificación de Iván para Maxi...');
    const notificationFromIvanToMaxi = {
      id: uuidv4(),
      type: 'test',
      content: `Notificación de prueba de Iván para Maxi ${Date.now()}`,
      from_id: IVAN_ID,
      to_id: MAXI_ID,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const createdNotificationFromIvan = await apiRequest('/notifications', 'POST', notificationFromIvanToMaxi);
    console.log(`Notificación creada: ${createdNotificationFromIvan.content}`);
    
    // Crear una nueva notificación de Maxi para Iván
    console.log('\n5. Creando una notificación de Maxi para Iván...');
    const notificationFromMaxiToIvan = {
      id: uuidv4(),
      type: 'test',
      content: `Notificación de prueba de Maxi para Iván ${Date.now()}`,
      from_id: MAXI_ID,
      to_id: IVAN_ID,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const createdNotificationFromMaxi = await apiRequest('/notifications', 'POST', notificationFromMaxiToIvan);
    console.log(`Notificación creada: ${createdNotificationFromMaxi.content}`);
    
    // Verificar que las notificaciones se han creado correctamente
    console.log('\n6. Verificando notificaciones creadas...');
    
    // Obtener notificación de Iván por ID
    const ivanNotification = await apiRequest(`/notifications/${createdNotificationFromIvan.id}`);
    console.log(`Notificación de Iván encontrada: ${ivanNotification.content}`);
    
    // Obtener notificación de Maxi por ID
    const maxiNotification = await apiRequest(`/notifications/${createdNotificationFromMaxi.id}`);
    console.log(`Notificación de Maxi encontrada: ${maxiNotification.content}`);
    
    // Marcar notificación de Iván como leída
    console.log('\n7. Marcando notificación de Iván como leída...');
    const readIvanNotification = await apiRequest(`/notifications/${createdNotificationFromIvan.id}/read`, 'PUT');
    console.log(`Notificación de Iván marcada como leída: ${readIvanNotification.read}`);
    
    // Marcar notificación de Maxi como leída
    console.log('\n8. Marcando notificación de Maxi como leída...');
    const readMaxiNotification = await apiRequest(`/notifications/${createdNotificationFromMaxi.id}/read`, 'PUT');
    console.log(`Notificación de Maxi marcada como leída: ${readMaxiNotification.read}`);
    
    // Eliminar notificaciones creadas
    console.log('\n9. Eliminando notificaciones creadas...');
    
    // Eliminar notificación de Iván
    const deleteIvanResult = await apiRequest(`/notifications/${createdNotificationFromIvan.id}`, 'DELETE');
    console.log(`Resultado de la eliminación de notificación de Iván: ${deleteIvanResult.message}`);
    
    // Eliminar notificación de Maxi
    const deleteMaxiResult = await apiRequest(`/notifications/${createdNotificationFromMaxi.id}`, 'DELETE');
    console.log(`Resultado de la eliminación de notificación de Maxi: ${deleteMaxiResult.message}`);
    
    console.log('\n=== Pruebas de notificaciones completadas con éxito ===');
  } catch (error) {
    console.error('Error en las pruebas de notificaciones:', error);
  }
}

// Ejecutar las pruebas
testNotifications().catch(console.error); 