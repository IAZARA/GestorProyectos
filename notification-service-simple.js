/**
 * Servicio de notificaciones simplificado para el Gestor de Proyectos
 * Esta versión está diseñada para desarrollo y no requiere autenticación JWT
 */

const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma
const prisma = new PrismaClient();

// Clase para el servicio de notificaciones
class NotificationService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // En producción, limitar a dominios específicos
        methods: ['GET', 'POST']
      }
    });
    
    this.connectedUsers = new Map();
    this.setupSocketHandlers();
    
    console.log('Servicio de notificaciones simplificado inicializado');
  }
  
  // Configurar los manejadores de eventos de Socket.IO
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Obtener el ID de usuario de la autenticación
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        console.log('Conexión rechazada: No se proporcionó ID de usuario');
        socket.disconnect();
        return;
      }
      
      console.log(`Usuario conectado: ${userId}`);
      this.connectedUsers.set(userId, socket.id);
      
      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${userId}`);
        this.connectedUsers.delete(userId);
      });
      
      // Manejar solicitud de notificaciones no leídas
      socket.on('get:unreadNotifications', async () => {
        try {
          console.log(`Solicitando notificaciones no leídas para usuario: ${userId}`);
          const notifications = await this.getUnreadNotifications(userId);
          socket.emit('notification:unread', notifications);
        } catch (error) {
          console.error('Error al obtener notificaciones no leídas:', error);
          socket.emit('error', { message: 'Error al obtener notificaciones no leídas' });
        }
      });
      
      // Manejar marcado de notificación como leída
      socket.on('notification:markAsRead', async (notificationId) => {
        try {
          console.log(`Marcando notificación ${notificationId} como leída`);
          await this.markNotificationAsRead(notificationId);
          socket.emit('notification:marked', notificationId);
        } catch (error) {
          console.error('Error al marcar notificación como leída:', error);
          socket.emit('error', { message: 'Error al marcar notificación como leída' });
        }
      });
      
      // Manejar envío de notificación
      socket.on('notification:send', async (data) => {
        try {
          console.log('Recibida solicitud para enviar notificación:', data);
          const notification = await this.createNotification(data);
          
          // Enviar la notificación al destinatario si está conectado
          const recipientSocketId = this.connectedUsers.get(data.toId);
          if (recipientSocketId) {
            this.io.to(recipientSocketId).emit('notification:new', notification);
          }
          
          socket.emit('notification:sent', notification);
        } catch (error) {
          console.error('Error al enviar notificación:', error);
          socket.emit('error', { message: 'Error al enviar notificación' });
        }
      });
    });
  }
  
  // Obtener notificaciones no leídas de un usuario
  async getUnreadNotifications(userId) {
    try {
      const notifications = await prisma.notification.findMany({
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
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Se encontraron ${notifications.length} notificaciones no leídas para el usuario ${userId}`);
      return notifications;
    } catch (error) {
      console.error(`Error al obtener notificaciones no leídas para el usuario ${userId}:`, error);
      throw error;
    }
  }
  
  // Crear una nueva notificación
  async createNotification(data) {
    try {
      const { type, content, toId, fromId } = data;
      
      if (!type || !content || !toId || !fromId) {
        throw new Error('Faltan campos requeridos para crear la notificación');
      }
      
      // Crear la notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          type,
          content,
          isRead: false,
          to: { connect: { id: toId } },
          from: { connect: { id: fromId } }
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
      
      console.log(`Notificación creada: ${notification.id}`);
      return notification;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  }
  
  // Marcar una notificación como leída
  async markNotificationAsRead(notificationId) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      
      console.log(`Notificación ${notificationId} marcada como leída`);
      return notification;
    } catch (error) {
      console.error(`Error al marcar notificación ${notificationId} como leída:`, error);
      throw error;
    }
  }
}

module.exports = NotificationService;
