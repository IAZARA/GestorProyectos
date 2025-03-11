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
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
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
          createdAt: notification.createdAt
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
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`Usuario ${userId} desconectado`);
          break;
        }
      }
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