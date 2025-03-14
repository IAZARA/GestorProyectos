const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log('Usuarios encontrados:', users.length);
    
    // Verificar la conexión al servidor WebSocket
    console.log('Intentando conectar al servidor WebSocket...');
    
    const socket = Client('http://localhost:3001', {
      auth: {
        userId: users[0].id
      }
    });
    
    socket.on('connect', () => {
      console.log('¡Conexión exitosa al servidor WebSocket!');
      console.log(`Socket ID: ${socket.id}`);
      console.log(`Usuario conectado: ${users[0].firstName} ${users[0].lastName} (${users[0].id})`);
      
      // Solicitar notificaciones no leídas
      socket.emit('get:unreadNotifications');
      
      // Esperar 2 segundos y luego desconectar
      setTimeout(() => {
        socket.disconnect();
        console.log('Desconectado del servidor WebSocket');
        process.exit(0);
      }, 2000);
    });
    
    socket.on('notification:unread', (notifications) => {
      console.log(`Recibidas ${notifications.length} notificaciones no leídas:`);
      notifications.forEach(n => {
        console.log(`- De: ${n.from.firstName} ${n.from.lastName}, Contenido: ${n.content}`);
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error.message);
      process.exit(1);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Desconectado:', reason);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // No desconectamos prisma aquí porque el socket puede seguir activo
    setTimeout(() => {
      prisma.$disconnect();
      process.exit(1);
    }, 5000);
  }
}

main(); 