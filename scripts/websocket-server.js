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

console.log('Inicializando servidor de WebSockets independiente...');

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
  
  console.log(`[SOCKET-SERVER] Usuario conectado: ${userId}`);
  
  // Verificar y corregir IDs conocidos
  let correctedUserId = userId;
  
  // Corregir ID para Ivan Zarate si es necesario
  if (userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c' && 
      (userId.includes('ivan') || userId.includes('zarate'))) {
    console.log('[SOCKET-SERVER] Corrigiendo ID de Ivan Zarate:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
    correctedUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
  }
  
  // Corregir ID para Maxi Scarimbolo si es necesario
  if (userId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f' && 
      (userId.includes('maxi') || userId.includes('scarimbolo'))) {
    console.log('[SOCKET-SERVER] Corrigiendo ID de Maxi Scarimbolo:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
    correctedUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
  }
  
  // Verificar que el usuario existe en la base de datos
  try {
    const user = await prisma.user.findUnique({
      where: { id: correctedUserId }
    });
    
    if (!user) {
      console.log(`[SOCKET-SERVER] Usuario no encontrado en la base de datos: ${correctedUserId}`);
      // Intentar buscar por nombre o email para diagnóstico
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
    
    console.log(`[SOCKET-SERVER] Usuario verificado: ${user.firstName} ${user.lastName} (${correctedUserId})`);
    
    // Registrar el socket para este usuario
    userSockets.set(correctedUserId, socket.id);
    socket.userId = correctedUserId;
    
    // Unir al usuario a su sala personal
    socket.join(correctedUserId);
    console.log(`[SOCKET-SERVER] Usuario unido a sala: ${correctedUserId}`);
    
    // Enviar notificaciones no leídas al usuario
    await sendUnreadNotifications(socket, correctedUserId);
    
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
      
      // Corregir ID para Ivan Zarate si es necesario
      let toId = adaptedData.toId;
      if (toId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c' && 
          (toId.includes('ivan') || toId.includes('zarate'))) {
        console.log('[SOCKET-SERVER] Corrigiendo ID de destinatario (Ivan Zarate):', toId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
        toId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
      }
      
      // Corregir ID para Maxi Scarimbolo si es necesario
      if (toId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f' && 
          (toId.includes('maxi') || toId.includes('scarimbolo'))) {
        console.log('[SOCKET-SERVER] Corrigiendo ID de destinatario (Maxi Scarimbolo):', toId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
        toId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
      }
      
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
  console.log(`Servidor WebSocket independiente ejecutándose en el puerto ${PORT}`);
}); 