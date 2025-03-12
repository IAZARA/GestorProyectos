import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string) => {
  if (!socket) {
    // Inicializar la conexión
    // Usar la URL base actual del navegador en lugar de hardcodear localhost:3001
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    socket = io(baseUrl, {
      withCredentials: true,
    });

    // Manejar la conexión
    socket.on('connect', () => {
      console.log('Conectado al servidor de WebSockets');
      
      // Autenticar al usuario
      socket.emit('authenticate', userId);
    });

    // Manejar la desconexión
    socket.on('disconnect', () => {
      console.log('Desconectado del servidor de WebSockets');
    });

    // Manejar errores
    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Función para enviar una notificación
export const sendNotification = (
  type: string,
  content: string,
  fromUserId: string,
  toUserId: string
) => {
  if (socket) {
    socket.emit('notification:create', {
      type,
      content,
      fromUserId,
      toUserId
    });
  }
};

// Función para marcar una notificación como leída
export const markNotificationAsRead = (notificationId: string) => {
  if (socket) {
    socket.emit('notification:markAsRead', notificationId);
  }
}; 