/**
 * Servicio de notificaciones para el Gestor de Proyectos
 * Este servicio gestiona las notificaciones en tiempo real utilizando WebSockets
 * y almacena las notificaciones en la base de datos.
 */

const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Inicializar Prisma
const prisma = new PrismaClient();

// Clave secreta para JWT (debe coincidir con la de api-auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

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
    
    console.log('Servicio de notificaciones inicializado');
  }
  
  // Configurar los manejadores de eventos de Socket.IO
  setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));
    
    this.io.on('connection', (socket) => {
      const userId = socket.user.id;
      
      console.log(`Usuario conectado: ${userId}`);
      this.connectedUsers.set(userId, socket.id);
      
      // Enviar notificaciones pendientes al usuario
      this.sendPendingNotifications(userId);
      
      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${userId}`);
        this.connectedUsers.delete(userId);
      });
      
      // Manejar marcado de notificación como leída
      socket.on('notification:markAsRead', async (data) => {
        try {
          const notificationId = data.notificationId;
          if (!notificationId) {
            socket.emit('error', { message: 'ID de notificación no proporcionado' });
            return;
          }
          
          console.log(`Marcando notificación como leída: ${notificationId}`);
          await this.markNotificationAsRead(notificationId);
          socket.emit('notification:marked', notificationId);
        } catch (error) {
          console.error('Error al marcar notificación como leída:', error);
          socket.emit('error', { message: 'Error al marcar notificación como leída' });
        }
      });
      
      // Manejar solicitud de notificaciones
      socket.on('get:unreadNotifications', async () => {
        try {
          console.log(`Solicitud de notificaciones no leídas de usuario: ${userId}`);
          const notifications = await this.getUserNotifications(userId);
          socket.emit('notifications:unread', notifications);
        } catch (error) {
          console.error('Error al obtener notificaciones:', error);
          socket.emit('error', { message: 'Error al obtener notificaciones' });
        }
      });
    });
  }
  
  // Middleware para autenticar conexiones de socket
  async authenticateSocket(socket, next) {
    try {
      // Obtener el userId del objeto auth (enviado desde el cliente)
      const userId = socket.handshake.auth.userId;
      
      // Verificar si se proporcionó un userId
      if (!userId) {
        console.log('Conexión rechazada: No se proporcionó userId');
        return next(new Error('Autenticación requerida'));
      }
      
      // Verificar si el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        console.log(`Conexión rechazada: Usuario no encontrado: ${userId}`);
        return next(new Error('Usuario no encontrado'));
      }
      
      // Adjuntar información del usuario al socket
      socket.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      console.log(`Usuario autenticado: ${user.firstName} ${user.lastName} (${userId})`);
      next();
    } catch (error) {
      console.error('Error de autenticación de socket:', error);
      next(new Error('Autenticación inválida'));
    }
  }
  
  // Enviar notificaciones pendientes a un usuario
  async sendPendingNotifications(userId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('notifications', notifications);
      }
    } catch (error) {
      console.error(`Error al enviar notificaciones pendientes al usuario ${userId}:`, error);
    }
  }
  
  // Obtener notificaciones de un usuario
  async getUserNotifications(userId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { toId: userId },
        orderBy: { createdAt: 'desc' },
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
      
      return notifications;
    } catch (error) {
      console.error(`Error al obtener notificaciones para el usuario ${userId}:`, error);
      throw error;
    }
  }
  
  // Crear una nueva notificación
  async createNotification(data) {
    try {
      const { toId, fromId, content, type } = data;
      
      // Crear la notificación en la base de datos
      const notification = await prisma.notification.create({
        data: {
          type,
          content,
          isRead: false,
          from: { connect: { id: fromId } },
          to: { connect: { id: toId } }
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
      
      console.log(`Notificación creada para el usuario ${toId}: ${content}`);
      
      // Enviar la notificación al usuario si está conectado
      const socketId = this.connectedUsers.get(toId);
      if (socketId) {
        this.io.to(socketId).emit('new-notification', notification);
      }
      
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
  
  // Enviar una notificación a todos los usuarios con un rol específico
  async notifyUsersByRole(role, data) {
    try {
      // Obtener todos los usuarios con el rol especificado
      const users = await prisma.user.findMany({
        where: { role }
      });
      
      // Crear y enviar notificaciones para cada usuario
      const notifications = [];
      for (const user of users) {
        const notification = await this.createNotification({
          ...data,
          toId: user.id
        });
        notifications.push(notification);
      }
      
      console.log(`Notificaciones enviadas a ${users.length} usuarios con rol ${role}`);
      return notifications;
    } catch (error) {
      console.error(`Error al notificar a usuarios con rol ${role}:`, error);
      throw error;
    }
  }
  
  // Enviar una notificación a todos los usuarios
  async notifyAllUsers(data) {
    try {
      // Obtener todos los usuarios
      const users = await prisma.user.findMany();
      
      // Crear y enviar notificaciones para cada usuario
      const notifications = [];
      for (const user of users) {
        const notification = await this.createNotification({
          ...data,
          toId: user.id
        });
        notifications.push(notification);
      }
      
      console.log(`Notificaciones enviadas a ${users.length} usuarios`);
      return notifications;
    } catch (error) {
      console.error('Error al notificar a todos los usuarios:', error);
      throw error;
    }
  }
  
  // Eliminar notificaciones antiguas
  async cleanupOldNotifications(days = 30) {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);
      
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: date
          },
          isRead: true
        }
      });
      
      console.log(`Se eliminaron ${result.count} notificaciones antiguas`);
      return result.count;
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 