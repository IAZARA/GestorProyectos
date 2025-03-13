import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string): Socket => {
  // Forzar el ID correcto para Ivan Zarate
  if (userId === 'b9e11de8-e612-4abd-b59d-ce3109a9820b') {
    console.log('Corrigiendo ID de Ivan Zarate en socket.ts:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
    userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
  }
  
  // Forzar el ID correcto para Maxi Scarimbolo si es necesario
  if (userId === '2' || userId === 'gestor') {
    console.log('Corrigiendo ID de Maxi Scarimbolo en socket.ts:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
    userId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
  }

  if (!socket) {
    // Inicializar la conexión
    console.log('Inicializando socket con URL: http://localhost:3000 para usuario:', userId);
    socket = io('http://localhost:3000', {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });

    // Manejar la conexión
    socket.on('connect', () => {
      console.log('Conectado al servidor de WebSockets con ID:', socket?.id);
      
      // Autenticar al usuario
      socket.emit('authenticate', userId);
      console.log('Enviada autenticación para usuario:', userId);
    });

    // Manejar la desconexión
    socket.on('disconnect', () => {
      console.log('Desconectado del servidor de WebSockets');
    });

    // Manejar errores
    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      console.log('Detalles del error:', error.message);
    });
    
    // Manejar errores del servidor
    socket.on('error', (error) => {
      console.error('Error recibido del servidor:', error);
    });
    
    // Manejar reconexiones
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconectado al servidor después de ${attemptNumber} intentos`);
      
      // Re-autenticar al usuario
      socket.emit('authenticate', userId);
      console.log('Re-enviada autenticación para usuario:', userId);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Intento de reconexión #${attemptNumber}`);
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('Error de reconexión:', error);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Falló la reconexión después de todos los intentos');
    });
  } else {
    console.log('Socket ya inicializado, reutilizando conexión existente');
    
    // Si el socket existe pero está desconectado, intentar reconectar
    if (!socket.connected) {
      console.log('Socket existente desconectado, intentando reconectar...');
      socket.connect();
    }
    
    // Re-autenticar al usuario por si acaso
    if (socket.connected) {
      socket.emit('authenticate', userId);
      console.log('Re-enviada autenticación para usuario:', userId);
    }
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    console.log('Cerrando conexión de socket');
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
): void => {
  console.log(`[NOTIFICACIÓN] Intentando enviar notificación: Tipo=${type}, De=${fromUserId}, Para=${toUserId}, Contenido="${content}"`);
  
  // Forzar el ID correcto para Ivan Zarate
  if (toUserId === 'b9e11de8-e612-4abd-b59d-ce3109a9820b') {
    console.log('Corrigiendo ID de Ivan Zarate en sendNotification:', toUserId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
    toUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
  }
  
  // Forzar el ID correcto para Maxi Scarimbolo
  if (toUserId === '2' || toUserId === 'gestor') {
    console.log('Corrigiendo ID de Maxi Scarimbolo en sendNotification:', toUserId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
    toUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
  }
  
  // Verificar si el ID de Maxi Scarimbolo es correcto
  if (toUserId === 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
    console.log('ID de Maxi Scarimbolo es correcto:', toUserId);
  }
  
  // Verificar si el ID de Ivan Zarate es correcto
  if (toUserId === '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
    console.log('ID de Ivan Zarate es correcto:', toUserId);
  }

  if (socket && socket.connected) {
    console.log(`Enviando notificación: ${type} de ${fromUserId} a ${toUserId}`);
    socket.emit('notification:create', {
      type,
      content,
      fromUserId,
      toUserId
    });
    console.log('Notificación enviada al servidor');
  } else {
    console.warn('No se puede enviar notificación: socket no inicializado o desconectado');
    console.log('Estado del socket:', socket ? (socket.connected ? 'conectado' : 'desconectado') : 'no inicializado');
    
    // Intentar reconectar si el socket existe pero está desconectado
    if (socket && !socket.connected) {
      console.log('Intentando reconectar para enviar notificación...');
      socket.connect();
      
      // Esperar un momento y luego intentar enviar la notificación
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log(`Reintentando enviar notificación: ${type} de ${fromUserId} a ${toUserId}`);
          socket.emit('notification:create', {
            type,
            content,
            fromUserId,
            toUserId
          });
          console.log('Notificación reenviada al servidor');
        } else {
          console.error('No se pudo reconectar para enviar la notificación');
        }
      }, 1000);
    }
  }
};

// Función para marcar una notificación como leída
export const markNotificationAsRead = (notificationId: string): void => {
  if (socket && socket.connected) {
    console.log(`Marcando notificación como leída: ${notificationId}`);
    socket.emit('notification:markAsRead', notificationId);
  } else {
    console.warn('No se puede marcar notificación como leída: socket no inicializado o desconectado');
    
    // Intentar reconectar si el socket existe pero está desconectado
    if (socket && !socket.connected) {
      console.log('Intentando reconectar para marcar notificación como leída...');
      socket.connect();
      
      // Esperar un momento y luego intentar marcar la notificación
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log(`Reintentando marcar notificación como leída: ${notificationId}`);
          socket.emit('notification:markAsRead', notificationId);
        } else {
          console.error('No se pudo reconectar para marcar la notificación como leída');
        }
      }, 1000);
    }
  }
}; 