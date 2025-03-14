/**
 * Script para probar el envío de notificaciones desde el cliente
 * Este script simula el comportamiento del cliente al enviar notificaciones
 */

// Importar módulos necesarios
const { initializeSocket, sendNotification } = require('../lib/socket');

// IDs de usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Función principal
async function testClientNotification() {
  console.log('Iniciando prueba de notificaciones desde el cliente...');
  
  // Inicializar el socket como Ivan
  console.log(`Inicializando socket como Ivan (${IVAN_ID})...`);
  const socket = initializeSocket(IVAN_ID);
  
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
  const result1 = sendNotification({
    type: 'test',
    content: 'Notificación de prueba con formato toId',
    fromId: IVAN_ID,
    toId: MAXI_ID
  });
  console.log('Resultado:', result1 ? 'Enviada' : 'Error');
  
  // Esperar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enviar notificación usando toUserId (formato nuevo)
  console.log('Enviando notificación con formato toUserId...');
  const result2 = sendNotification({
    type: 'test',
    content: 'Notificación de prueba con formato toUserId',
    fromUserId: IVAN_ID,
    toUserId: MAXI_ID
  });
  console.log('Resultado:', result2 ? 'Enviada' : 'Error');
  
  // Esperar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enviar notificación con formato mixto
  console.log('Enviando notificación con formato mixto...');
  const result3 = sendNotification({
    type: 'test',
    content: 'Notificación de prueba con formato mixto',
    fromId: IVAN_ID,
    toUserId: MAXI_ID
  });
  console.log('Resultado:', result3 ? 'Enviada' : 'Error');
  
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