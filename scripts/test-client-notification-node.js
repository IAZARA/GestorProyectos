/**
 * Script para probar el envío de notificaciones desde el cliente usando Node.js
 * Este script simula el comportamiento del cliente al enviar notificaciones
 */

// Importar módulos necesarios
const { io } = require('socket.io-client');

// IDs de usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Función principal
async function testClientNotification() {
  console.log('Iniciando prueba de notificaciones desde el cliente (Node.js)...');
  
  // Crear socket
  console.log(`Inicializando socket como Ivan (${IVAN_ID})...`);
  const socket = io('http://localhost:3001', {
    auth: { userId: IVAN_ID },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // Manejar eventos del socket
  socket.on('connect', () => {
    console.log('Socket conectado con ID:', socket.id);
    console.log('Usuario autenticado:', IVAN_ID);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket desconectado, razón:', reason);
  });
  
  // Esperar a que el socket se conecte
  await new Promise(resolve => {
    if (socket.connected) {
      console.log('Socket ya conectado');
      resolve();
    } else {
      console.log('Esperando conexión del socket...');
      socket.on('connect', () => {
        console.log('Socket conectado');
        resolve();
      });
      
      // Timeout después de 5 segundos
      setTimeout(() => {
        if (!socket.connected) {
          console.log('Timeout esperando conexión');
          resolve();
        }
      }, 5000);
    }
  });
  
  // Enviar notificación usando toId (formato antiguo)
  console.log('Enviando notificación con formato toId...');
  socket.emit('notification:send', {
    type: 'test',
    content: 'Notificación de prueba con formato toId desde Node.js',
    fromId: IVAN_ID,
    toId: MAXI_ID
  });
  
  // Esperar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enviar notificación usando toUserId (formato nuevo)
  console.log('Enviando notificación con formato toUserId...');
  socket.emit('notification:send', {
    type: 'test',
    content: 'Notificación de prueba con formato toUserId desde Node.js',
    fromUserId: IVAN_ID,
    toUserId: MAXI_ID
  });
  
  // Esperar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enviar notificación con formato mixto
  console.log('Enviando notificación con formato mixto...');
  socket.emit('notification:send', {
    type: 'test',
    content: 'Notificación de prueba con formato mixto desde Node.js',
    fromId: IVAN_ID,
    toUserId: MAXI_ID
  });
  
  // Esperar 3 segundos para que las notificaciones se procesen
  console.log('Esperando 3 segundos para que las notificaciones se procesen...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Desconectar el socket
  console.log('Desconectando socket...');
  socket.disconnect();
  
  console.log('Prueba completada');
}

// Ejecutar la función principal
testClientNotification().catch(error => {
  console.error('Error en la prueba:', error);
  process.exit(1);
}); 