/**
 * Script para probar la conexión al servidor de WebSocket
 * Este script intenta conectarse al servidor de WebSocket y enviar/recibir mensajes
 */

const { io } = require('socket.io-client');

// IDs de usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// URL del servidor de WebSocket
const SOCKET_URL = 'http://localhost:3001';

// Función para probar la conexión al servidor de WebSocket
async function testWebSocketConnection() {
  console.log('=== Iniciando prueba de conexión al servidor de WebSocket ===');
  console.log(`Intentando conectar a: ${SOCKET_URL}`);
  
  // Crear socket para Iván
  const ivanSocket = io(SOCKET_URL, {
    auth: { userId: IVAN_ID },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // Manejar eventos del socket de Iván
  ivanSocket.on('connect', () => {
    console.log(`[IVAN] Conectado con ID: ${ivanSocket.id}`);
    console.log(`[IVAN] Usuario autenticado: ${ivanSocket.auth?.userId}`);
    
    // Solicitar notificaciones no leídas
    console.log('[IVAN] Solicitando notificaciones no leídas...');
    ivanSocket.emit('get:unreadNotifications');
  });
  
  ivanSocket.on('connect_error', (error) => {
    console.error(`[IVAN] Error de conexión: ${error.message}`);
  });
  
  ivanSocket.on('notification:new', (notification) => {
    console.log(`[IVAN] Nueva notificación recibida: ${JSON.stringify(notification)}`);
  });
  
  ivanSocket.on('notification:unread', (notifications) => {
    console.log(`[IVAN] Notificaciones no leídas recibidas: ${notifications.length}`);
    notifications.forEach((notification, index) => {
      console.log(`[IVAN] Notificación ${index + 1}: ${notification.content}`);
    });
  });
  
  // Esperar 2 segundos antes de crear el socket para Maxi
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Crear socket para Maxi
  const maxiSocket = io(SOCKET_URL, {
    auth: { userId: MAXI_ID },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // Manejar eventos del socket de Maxi
  maxiSocket.on('connect', () => {
    console.log(`[MAXI] Conectado con ID: ${maxiSocket.id}`);
    console.log(`[MAXI] Usuario autenticado: ${maxiSocket.auth?.userId}`);
    
    // Solicitar notificaciones no leídas
    console.log('[MAXI] Solicitando notificaciones no leídas...');
    maxiSocket.emit('get:unreadNotifications');
  });
  
  maxiSocket.on('connect_error', (error) => {
    console.error(`[MAXI] Error de conexión: ${error.message}`);
  });
  
  maxiSocket.on('notification:new', (notification) => {
    console.log(`[MAXI] Nueva notificación recibida: ${JSON.stringify(notification)}`);
  });
  
  maxiSocket.on('notification:unread', (notifications) => {
    console.log(`[MAXI] Notificaciones no leídas recibidas: ${notifications.length}`);
    notifications.forEach((notification, index) => {
      console.log(`[MAXI] Notificación ${index + 1}: ${notification.content}`);
    });
  });
  
  // Esperar 5 segundos antes de enviar notificaciones
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Enviar notificación de Iván para Maxi
  console.log('\n[IVAN] Enviando notificación a Maxi...');
  ivanSocket.emit('notification:send', {
    type: 'test',
    content: `Notificación de prueba de Iván para Maxi ${Date.now()}`,
    fromUserId: IVAN_ID,
    toUserId: MAXI_ID
  });
  
  // Esperar 2 segundos antes de enviar la siguiente notificación
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Enviar notificación de Maxi para Iván
  console.log('\n[MAXI] Enviando notificación a Iván...');
  maxiSocket.emit('notification:send', {
    type: 'test',
    content: `Notificación de prueba de Maxi para Iván ${Date.now()}`,
    fromUserId: MAXI_ID,
    toUserId: IVAN_ID
  });
  
  // Esperar 10 segundos antes de cerrar las conexiones
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Cerrar conexiones
  console.log('\nCerrando conexiones...');
  ivanSocket.disconnect();
  maxiSocket.disconnect();
  
  console.log('\n=== Prueba de conexión al servidor de WebSocket completada ===');
}

// Ejecutar la prueba
testWebSocketConnection().catch(console.error); 