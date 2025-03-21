import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';

interface NotificationPayload {
  type: string;
  content: string;
  fromUserId: string;
  toUserId: string;
}

export function initializeSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Mapa para mantener un registro de qué socket pertenece a qué usuario
  const userSocketMap = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log('Cliente conectado:', socket.id);

    // Autenticar al usuario y registrar su socket
    socket.on('authenticate', (userId: string) => {
      userSocketMap.set(userId, socket.id);
      console.log(`Usuario ${userId} autenticado con socket ${socket.id}`);
      
      // Unirse a una sala específica para este usuario
      socket.join(`user:${userId}`);
      
      // Enviar notificaciones no leídas al usuario cuando se conecta
      sendUnreadNotifications(userId, socket);
    });
    
    // Manejar solicitud explícita de notificaciones no leídas
    socket.on('get:unreadNotifications', () => {
      // Encontrar el userId asociado con este socket
      let userId: string | undefined;
      
      // Usar Array.from para convertir las entradas del mapa a un array
      const entries = Array.from(userSocketMap.entries());
      for (const [key, value] of entries) {
        if (value === socket.id) {
          userId = key;
          break;
        }
      }
      
      if (userId) {
        console.log(`Solicitud explícita de notificaciones no leídas para usuario ${userId}`);
        sendUnreadNotifications(userId, socket);
      } else {
        console.warn('No se pudo identificar el usuario para la solicitud de notificaciones no leídas');
      }
    });

    // Manejar la creación de notificaciones
    socket.on('notification:create', async (payload: NotificationPayload) => {
      try {
        // Guardar la notificación en la base de datos
        const notification = await prisma.notification.create({
          data: {
            type: payload.type,
            content: payload.content,
            fromId: payload.fromUserId,
            toId: payload.toUserId,
            isRead: false
          }
        });

        // Enviar la notificación al usuario destinatario si está conectado
        io.to(`user:${payload.toUserId}`).emit('notification:new', {
          id: notification.id,
          type: notification.type,
          content: notification.content,
          fromId: notification.fromId,
          createdAt: notification.createdAt,
          isRead: notification.isRead
        });

        console.log(`Notificación enviada a usuario ${payload.toUserId}`);
      } catch (error) {
        console.error('Error al crear notificación:', error);
      }
    });

    // Manejar la marcación de notificaciones como leídas
    socket.on('notification:markAsRead', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true }
        });
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    });

    // Manejar la desconexión
    socket.on('disconnect', () => {
      // Eliminar el usuario del mapa cuando se desconecta
      // Convertir a array para evitar problemas de compatibilidad
      Array.from(userSocketMap.entries()).forEach(([userId, socketId]) => {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`Usuario ${userId} desconectado`);
        }
      });
    });
  });

  return io;
}

// Función para enviar notificaciones no leídas a un usuario
async function sendUnreadNotifications(userId: string, socket: Socket) {
  try {
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

    if (unreadNotifications.length > 0) {
      socket.emit('notification:unread', unreadNotifications);
    }
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
  }
} 