import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Función para procesar notificaciones pendientes
const processPendingNotifications = () => {
  if (!socket || !socket.connected) return;
  
  try {
    const pendingNotificationsStr = localStorage.getItem('pendingNotifications');
    if (!pendingNotificationsStr) return;
    
    const pendingNotifications = JSON.parse(pendingNotificationsStr);
    if (!Array.isArray(pendingNotifications) || pendingNotifications.length === 0) return;
    
    console.log(`[SOCKET] Procesando ${pendingNotifications.length} notificaciones pendientes`);
    
    // Filtrar notificaciones más recientes que 24 horas
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentNotifications = pendingNotifications.filter(notification => {
      if (!notification.timestamp) return true;
      return new Date(notification.timestamp) > oneDayAgo;
    });
    
    // Enviar notificaciones pendientes
    let successCount = 0;
    recentNotifications.forEach(notification => {
      try {
        if (socket && socket.connected) {
          // Crear una copia para no modificar el objeto original
          const adaptedNotification = { ...notification };
          
          // Convertir toUserId a toId si es necesario
          if (adaptedNotification.toUserId && !adaptedNotification.toId) {
            adaptedNotification.toId = adaptedNotification.toUserId;
            delete adaptedNotification.toUserId;
          }
          
          // Convertir fromUserId a fromId si es necesario
          if (adaptedNotification.fromUserId && !adaptedNotification.fromId) {
            adaptedNotification.fromId = adaptedNotification.fromUserId;
            delete adaptedNotification.fromUserId;
          }
          
          console.log('[SOCKET] Enviando notificación pendiente:', adaptedNotification);
          socket.emit('notification:send', adaptedNotification);
          successCount++;
        }
      } catch (error) {
        console.error('[SOCKET] Error al enviar notificación pendiente:', error);
      }
    });
    
    console.log(`[SOCKET] Se enviaron ${successCount} de ${recentNotifications.length} notificaciones pendientes`);
    
    // Limpiar notificaciones enviadas
    localStorage.setItem('pendingNotifications', '[]');
  } catch (error) {
    console.error('[SOCKET] Error al procesar notificaciones pendientes:', error);
  }
};

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
          
          // Procesar notificaciones pendientes
          processPendingNotifications();
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
        
        // Procesar notificaciones pendientes
        processPendingNotifications();
      });
      
      return socket;
    }
  }

  // Crear un nuevo socket
  console.log('[SOCKET] Creando nuevo socket para usuario:', correctedUserId);
  
  // Conectar al servidor WebSocket independiente en el puerto 3001
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const socketUrl = `http://${host}:3001`;
  console.log('[SOCKET] Conectando a:', socketUrl);
  
  socket = io(socketUrl, {
    auth: { 
      userId: correctedUserId
    },
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

export const sendNotification = (notification: any): boolean => {
  if (!notification) {
    console.warn('[SOCKET] No se puede enviar notificación, datos inválidos');
    return false;
  }
  
  // Crear una copia para no modificar el objeto original
  const adaptedNotification = { ...notification };
  
  // Convertir toUserId a toId si es necesario
  if (adaptedNotification.toUserId && !adaptedNotification.toId) {
    adaptedNotification.toId = adaptedNotification.toUserId;
    delete adaptedNotification.toUserId;
  }
  
  // Convertir fromUserId a fromId si es necesario
  if (adaptedNotification.fromUserId && !adaptedNotification.fromId) {
    adaptedNotification.fromId = adaptedNotification.fromUserId;
    delete adaptedNotification.fromUserId;
  }
  
  // Verificar campos requeridos
  if (!adaptedNotification.type || !adaptedNotification.content || 
      (!adaptedNotification.toId && !adaptedNotification.toUserId)) {
    console.warn('[SOCKET] No se puede enviar notificación, faltan campos requeridos', adaptedNotification);
    return false;
  }
  
  if (!socket) {
    console.warn('[SOCKET] No se puede enviar notificación, socket no inicializado');
    
    // Intentar guardar la notificación en localStorage para enviarla más tarde
    try {
      const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      pendingNotifications.push({
        ...adaptedNotification,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));
      console.log('[SOCKET] Notificación guardada para envío posterior');
    } catch (error) {
      console.error('[SOCKET] Error al guardar notificación pendiente:', error);
    }
    
    return false;
  }
  
  if (!socket.connected) {
    console.warn('[SOCKET] No se puede enviar notificación, socket no conectado');
    
    // Intentar reconectar el socket
    try {
      socket.connect();
      console.log('[SOCKET] Intentando reconectar socket para enviar notificación');
    } catch (error) {
      console.error('[SOCKET] Error al reconectar socket:', error);
    }
    
    // Intentar guardar la notificación en localStorage para enviarla más tarde
    try {
      const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      pendingNotifications.push({
        ...adaptedNotification,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));
      console.log('[SOCKET] Notificación guardada para envío posterior');
    } catch (error) {
      console.error('[SOCKET] Error al guardar notificación pendiente:', error);
    }
    
    return false;
  }
  
  try {
    console.log('[SOCKET] Enviando notificación:', adaptedNotification);
    socket.emit('notification:send', adaptedNotification);
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
  
  console.log('[SOCKET] Marcando notificación como leída:', notificationId);
  socket.emit('notification:markAsRead', notificationId);
}; 