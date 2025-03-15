import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface Notification {
  type: string;
  content: string;
  toId: string;
  fromId: string;
  timestamp?: string;
}

// Función para procesar notificaciones pendientes
const processPendingNotifications = () => {
  if (!socket || !socket.connected) return;
  
  try {
    console.log('[SOCKET] Solicitando notificaciones no leídas');
    socket.emit('get:unreadNotifications');
  } catch (error) {
    console.error('[SOCKET] Error al solicitar notificaciones no leídas:', error);
  }
};

export const initializeSocket = (userId: string): Socket => {
  // Si ya existe un socket y está conectado, verificamos la autenticación
  if (socket) {
    console.log('[SOCKET] Socket ya inicializado, verificando autenticación');
    
    // Si el socket ya está autenticado con otro usuario, lo desconectamos
    const currentAuthUserId = (socket as any).auth?.userId;
    if (currentAuthUserId && currentAuthUserId !== userId) {
      console.log('[SOCKET] Cambiando autenticación de usuario:', currentAuthUserId, '->', userId);
      socket.disconnect();
      socket = null;
    } else if (socket.connected) {
      console.log('[SOCKET] Reutilizando socket existente para usuario:', userId);
      
      // Actualizar la autenticación
      (socket as any).auth = { userId };
      
      // Solicitar notificaciones no leídas inmediatamente
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log('[SOCKET] Solicitando notificaciones no leídas después de reutilizar socket');
          socket.emit('get:unreadNotifications');
          
          // Procesar notificaciones pendientes
          processPendingNotifications();
        }
      }, 500);
      
      return socket;
    } else {
      console.log('[SOCKET] Socket existente pero desconectado, reconectando...');
      (socket as any).auth = { userId };
      socket.connect();
      
      // Solicitar notificaciones no leídas después de reconectar
      socket.on('connect', () => {
        console.log('[SOCKET] Socket reconectado, solicitando notificaciones no leídas');
        socket?.emit('get:unreadNotifications');
        
        // Procesar notificaciones pendientes
        processPendingNotifications();
      });
      
      return socket;
    }
  }

  // Crear un nuevo socket
  console.log('[SOCKET] Creando nuevo socket para usuario:', userId);
  
  // Conectar al servidor WebSocket independiente en el puerto 3000
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const socketUrl = `http://${host}:3000`;
  console.log('[SOCKET] Conectando a:', socketUrl);
  
  socket = io(socketUrl, {
    auth: { userId },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });

  // Configurar eventos para el nuevo socket
  socket.on('connect', () => {
    console.log('[SOCKET] Conectado con ID:', socket?.id);
    console.log('[SOCKET] Usuario autenticado:', (socket as any).auth?.userId);
    
    // Solicitar notificaciones no leídas inmediatamente después de conectar
    setTimeout(() => {
      if (socket && socket.connected) {
        console.log('[SOCKET] Solicitando notificaciones no leídas después de conectar');
        socket.emit('get:unreadNotifications');
        
        // Procesar notificaciones pendientes
        processPendingNotifications();
      }
    }, 500);
  });

  socket.on('connect_error', (error) => {
    console.error('[SOCKET] Error de conexión:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Desconectado, razón:', reason);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const sendNotification = (notification: Notification): boolean => {
  if (!notification) {
    console.warn('[SOCKET] No se puede enviar notificación, datos inválidos');
    return false;
  }
  
  // Verificar campos requeridos
  if (!notification.type || !notification.content || !notification.toId) {
    console.warn('[SOCKET] No se puede enviar notificación, faltan campos requeridos');
    return false;
  }
  
  // Verificar conexión del socket
  if (!socket || !socket.connected) {
    console.warn('[SOCKET] No se puede enviar notificación, socket no conectado');
    return false;
  }
  
  try {
    // Enviar la notificación
    socket.emit('notification:send', notification);
    console.log('[SOCKET] Notificación enviada:', notification);
    return true;
  } catch (error) {
    console.error('[SOCKET] Error al enviar notificación:', error);
    return false;
  }
};

export const markNotificationAsRead = (notificationId: string): void => {
  if (!socket || !socket.connected) {
    console.warn('[SOCKET] No se puede marcar notificación como leída, socket no conectado');
    return;
  }
  
  try {
    socket.emit('notification:markAsRead', { notificationId });
    console.log('[SOCKET] Notificación marcada como leída:', notificationId);
  } catch (error) {
    console.error('[SOCKET] Error al marcar notificación como leída:', error);
  }
};