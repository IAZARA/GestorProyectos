/**
 * Script para probar que las notificaciones funcionan para todos los usuarios
 * Este script envía una notificación de prueba a cada usuario en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { io } = require('socket.io-client');

// Función para enviar una notificación a un usuario
async function sendNotificationToUser(userId, content) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Conectando al servidor WebSocket para enviar notificación a usuario ${userId}...`);
      
      // Conectar al servidor WebSocket
      const socket = io('http://localhost:3001', {
        auth: { userId: 'system-test' },
        reconnection: true,
        reconnectionAttempts: 3,
        timeout: 5000
      });
      
      // Manejar errores de conexión
      socket.on('connect_error', (error) => {
        console.error(`Error de conexión: ${error.message}`);
        socket.disconnect();
        reject(new Error(`Error de conexión: ${error.message}`));
      });
      
      // Cuando se conecte, enviar la notificación
      socket.on('connect', () => {
        console.log(`Conectado al servidor WebSocket con ID: ${socket.id}`);
        
        // Crear la notificación
        const notification = {
          type: 'system_message',
          content: content || `Notificación de prueba para verificar la conexión - ${new Date().toLocaleTimeString()}`,
          toUserId: userId,
          fromUserId: 'system-test'
        };
        
        console.log(`Enviando notificación a usuario ${userId}:`, notification);
        
        // Enviar la notificación
        socket.emit('notification:send', notification);
        
        // Esperar un momento y desconectar
        setTimeout(() => {
          socket.disconnect();
          console.log(`Desconectado del servidor WebSocket`);
          resolve(true);
        }, 1000);
      });
      
      // Establecer un timeout por si no se conecta
      setTimeout(() => {
        if (!socket.connected) {
          socket.disconnect();
          reject(new Error('Timeout al conectar al servidor WebSocket'));
        }
      }, 5000);
      
    } catch (error) {
      console.error(`Error al enviar notificación: ${error.message}`);
      reject(error);
    }
  });
}

// Función principal
async function main() {
  try {
    console.log('Obteniendo lista de usuarios...');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios`);
    
    // Enviar una notificación a cada usuario
    for (const user of users) {
      console.log(`\nProcesando usuario: ${user.firstName} ${user.lastName} (${user.id})`);
      
      try {
        // Enviar notificación personalizada
        await sendNotificationToUser(
          user.id, 
          `Hola ${user.firstName}, esta es una notificación de prueba para verificar que el sistema funciona correctamente. Hora: ${new Date().toLocaleTimeString()}`
        );
        
        console.log(`✅ Notificación enviada correctamente a ${user.firstName} ${user.lastName}`);
        
        // Esperar un momento entre cada envío
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error al enviar notificación a ${user.firstName} ${user.lastName}: ${error.message}`);
      }
    }
    
    console.log('\nProceso completado. Se enviaron notificaciones a todos los usuarios.');
    
  } catch (error) {
    console.error(`Error en el proceso principal: ${error.message}`);
  } finally {
    // Cerrar la conexión con la base de datos
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
main(); 