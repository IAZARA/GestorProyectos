const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 3001;

// Mapeo de usuarios a sockets
const userSockets = new Map();

// Crear un servidor HTTP básico
const httpServer = createServer();

// Crear el servidor de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

console.log('Inicializando servidor de WebSockets mejorado...');

// Manejar conexiones de clientes
io.on('connection', async (socket) => {
  console.log(`[SOCKET-SERVER] Nueva conexión: ${socket.id}`);
  
  // Obtener el ID de usuario de la autenticación
  const userId = socket.handshake.auth?.userId;
  
  if (!userId) {
    console.log('[SOCKET-SERVER] Conexión sin ID de usuario, desconectando');
    socket.disconnect();
    return;
  }
  
  console.log(`[SOCKET-SERVER] Usuario conectado con ID: ${userId}`);
  
  // Verificar que el usuario existe en la base de datos
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log(`[SOCKET-SERVER] Usuario no encontrado en la base de datos: ${userId}`);
      
      // Intentar buscar por email o nombre para diagnóstico
      const possibleUsers = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: userId, mode: 'insensitive' } },
            { lastName: { contains: userId, mode: 'insensitive' } },
            { email: { contains: userId, mode: 'insensitive' } }
          ]
        }
      });
      
      if (possibleUsers.length > 0) {
        console.log('[SOCKET-SERVER] Posibles coincidencias de usuario:', possibleUsers.map(u => `${u.id} (${u.firstName} ${u.lastName})`));
      }
      
      socket.disconnect();
      return;
    }
    
    console.log(`[SOCKET-SERVER] Usuario verificado: ${user.firstName} ${user.lastName} (${userId})`);
    
    // Registrar el socket para este usuario
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    
    // Unir al usuario a su sala personal
    socket.join(userId);
    console.log(`[SOCKET-SERVER] Usuario unido a sala: ${userId}`);
    
    // Enviar notificaciones no leídas al usuario
    await sendUnreadNotifications(socket, userId);
    
  } catch (error) {
    console.error('[SOCKET-SERVER] Error al verificar usuario:', error);
    socket.disconnect();
    return;
  }
  
  // Manejar solicitud de notificaciones no leídas
  socket.on('get:unreadNotifications', async () => {
    console.log(`[SOCKET-SERVER] Solicitud de notificaciones no leídas de: ${socket.userId}`);
    await sendUnreadNotifications(socket, socket.userId);
  });
  
  // Manejar creación de notificaciones
  socket.on('notification:send', async (notificationData) => {
    try {
      console.log('[SOCKET-SERVER] Solicitud para enviar notificación:', notificationData);
      
      // Adaptar campos si es necesario
      const adaptedData = { ...notificationData };
      
      // Convertir toUserId a toId si es necesario
      if (adaptedData.toUserId && !adaptedData.toId) {
        adaptedData.toId = adaptedData.toUserId;
        delete adaptedData.toUserId;
      }
      
      // Convertir fromUserId a fromId si es necesario
      if (adaptedData.fromUserId && !adaptedData.fromId) {
        adaptedData.fromId = adaptedData.fromUserId;
        delete adaptedData.fromUserId;
      }
      
      // Verificar datos mínimos requeridos
      if (!adaptedData.type || !adaptedData.content || !adaptedData.toId) {
        console.error('[SOCKET-SERVER] Datos de notificación incompletos');
        return;
      }
      
      // Usar el ID del socket como remitente si no se proporciona
      const fromId = adaptedData.fromId || socket.userId;
      const toId = adaptedData.toId;
      
      // Verificar que el destinatario existe
      const toUser = await prisma.user.findUnique({
        where: { id: toId }
      });
      
      if (!toUser) {
        console.error(`[SOCKET-SERVER] Usuario destinatario no encontrado: ${toId}`);
        return;
      }
      
      // Crear la notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          type: adaptedData.type,
          content: adaptedData.content,
          from: { connect: { id: fromId } },
          to: { connect: { id: toId } },
          isRead: false
        },
        include: {
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true
            }
          }
        }
      });
      
      console.log(`[SOCKET-SERVER] Notificación creada: ${notification.id} para usuario ${toId}`);
      
      // Enviar la notificación al destinatario si está conectado
      const recipientSocketId = userSockets.get(toId);
      if (recipientSocketId) {
        console.log(`[SOCKET-SERVER] Enviando notificación a socket: ${recipientSocketId}`);
        io.to(recipientSocketId).emit('notification:new', notification);
      } else {
        console.log(`[SOCKET-SERVER] Usuario ${toId} no está conectado, la notificación se entregará cuando se conecte`);
      }
      
    } catch (error) {
      console.error('[SOCKET-SERVER] Error al crear notificación:', error);
    }
  });
  
  // Manejar marcar notificación como leída
  socket.on('notification:markAsRead', async (notificationId) => {
    try {
      console.log(`[SOCKET-SERVER] Marcando notificación como leída: ${notificationId}`);
      
      // Verificar que la notificación existe
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      
      if (!notification) {
        console.error(`[SOCKET-SERVER] Notificación no encontrada: ${notificationId}`);
        return;
      }
      
      // Actualizar la notificación
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      
      console.log(`[SOCKET-SERVER] Notificación marcada como leída: ${notificationId}`);
      
    } catch (error) {
      console.error('[SOCKET-SERVER] Error al marcar notificación como leída:', error);
    }
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`[SOCKET-SERVER] Usuario desconectado: ${socket.userId}`);
    
    // Eliminar el socket del mapeo
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
  });
});

// Función para enviar notificaciones no leídas a un usuario
async function sendUnreadNotifications(socket, userId) {
  try {
    console.log(`[SOCKET-SERVER] Buscando notificaciones no leídas para: ${userId}`);
    
    // Obtener notificaciones no leídas
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        toId: userId,
        isRead: false
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`[SOCKET-SERVER] Encontradas ${unreadNotifications.length} notificaciones no leídas para: ${userId}`);
    
    // Enviar notificaciones al usuario
    socket.emit('notification:unread', unreadNotifications);
    
  } catch (error) {
    console.error('[SOCKET-SERVER] Error al enviar notificaciones no leídas:', error);
  }
}

// Iniciar el servidor
httpServer.listen(PORT, () => {
  console.log(`Servidor WebSocket mejorado ejecutándose en el puerto ${PORT}`);
}); 