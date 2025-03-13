import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string): Socket => {
  // Verificar y corregir IDs conocidos
  let correctedUserId = userId;
  
  // Corregir ID para Ivan Zarate
  if (userId && userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c' && 
      (userId.includes('ivan') || userId.includes('zarate'))) {
    console.log('[SOCKET] Corrigiendo ID de Ivan Zarate:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
    correctedUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
  }
  
  // Corregir ID para Maxi Scarimbolo
  if (userId && userId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f' && 
      (userId.includes('maxi') || userId.includes('scarimbolo'))) {
    console.log('[SOCKET] Corrigiendo ID de Maxi Scarimbolo:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
    correctedUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
  }

  // Si ya existe un socket y está conectado, lo reutilizamos
  if (socket) {
    console.log('[SOCKET] Socket ya inicializado, verificando autenticación');
    
    // Si el socket ya está autenticado con otro usuario, lo desconectamos
    const currentAuthUserId = (socket as any).auth?.userId;
    if (currentAuthUserId && currentAuthUserId !== correctedUserId) {
      console.log('[SOCKET] Cambiando autenticación de usuario:', currentAuthUserId, '->', correctedUserId);
      socket.disconnect();
      socket = null;
    } else if (socket.connected) {
      console.log('[SOCKET] Reutilizando socket existente para usuario:', correctedUserId);
      
      // Actualizar la autenticación por si acaso
      (socket as any).auth = { userId: correctedUserId };
      
      // Solicitar notificaciones no leídas inmediatamente
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log('[SOCKET] Solicitando notificaciones no leídas después de reutilizar socket');
          socket.emit('get:unreadNotifications');
        }
      }, 500);
      
      return socket;
    } else {
      console.log('[SOCKET] Socket existente pero desconectado, reconectando...');
      (socket as any).auth = { userId: correctedUserId };
      socket.connect();
      
      // Solicitar notificaciones no leídas después de reconectar
      socket.on('connect', () => {
        console.log('[SOCKET] Socket reconectado, solicitando notificaciones no leídas');
        socket?.emit('get:unreadNotifications');
      });
      
      return socket;
    }
  }

  // Crear un nuevo socket
  console.log('[SOCKET] Creando nuevo socket para usuario:', correctedUserId);
  socket = io('http://localhost:3000', {
    auth: { userId: correctedUserId },
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

export const sendNotification = (notification: any): void => {
  if (!socket || !socket.connected) {
    console.warn('[SOCKET] No se puede enviar notificación, socket no conectado');
    return;
  }
  
  console.log('[SOCKET] Enviando notificación:', notification);
  socket.emit('notification:send', notification);
};

export const markNotificationAsRead = (notificationId: string): void => {
  if (!socket || !socket.connected) {
    console.warn('[SOCKET] No se puede marcar notificación como leída, socket no conectado');
    return;
  }
  
  console.log('[SOCKET] Marcando notificación como leída:', notificationId);
  socket.emit('notification:markAsRead', notificationId);
}; 