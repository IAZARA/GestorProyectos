'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../../store/userStore';
import { initializeSocket, getSocket, markNotificationAsRead } from '../../lib/socket';
import { Bell, Calendar, MessageSquare, FileText, Users, BookOpen, RefreshCw, WifiOff } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  content: string;
  fromUserId?: string;
  fromId?: string; // Para compatibilidad con versiones anteriores
  createdAt: Date;
  isRead: boolean;
  from?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = useUserStore(state => state.currentUser);
  const [socketStatus, setSocketStatus] = useState<string>('Desconectado');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Función para solicitar notificaciones no leídas
  const requestNotifications = useCallback(() => {
    const socket = getSocket();
    if (socket && socket.connected) {
      console.log('[NOTIFICACIONES] Solicitando notificaciones no leídas');
      setIsLoading(true);
      socket.emit('get:unreadNotifications');
      setLastRefresh(new Date());
      
      // Establecer un timeout para detectar si no hay respuesta
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      console.log('[NOTIFICACIONES] No se pueden solicitar notificaciones, socket desconectado');
      setSocketStatus('Desconectado');
      
      // Intentar reconectar si está desconectado
      if (socket) {
        try {
          socket.connect();
          setSocketStatus('Reconectando...');
        } catch (error) {
          console.error('[NOTIFICACIONES] Error al reconectar socket:', error);
          setSocketStatus('Error de conexión');
        }
      } else if (currentUser) {
        // Si no hay socket, inicializar uno nuevo
        initializeSocket(currentUser.id);
        setSocketStatus('Inicializando...');
      }
    }
  }, [currentUser]);

  // Función para reiniciar el socket
  const resetSocket = useCallback(() => {
    if (!currentUser) return;
    
    console.log('[NOTIFICACIONES] Reiniciando conexión de socket');
    setSocketStatus('Reiniciando...');
    setRetryCount(prev => prev + 1);
    
    // Obtener el socket actual y desconectarlo si existe
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.disconnect();
    }
    
    // Corregir ID de usuario si es necesario
    let userId = currentUser.id;
    if (currentUser.email === 'ivan.zarate@minseg.gob.ar' && userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
      console.log('[NOTIFICACIONES] Corrigiendo ID de Ivan Zarate en NotificationCenter:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
      userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
    } else if (currentUser.email === 'maxi.scarimbolo@minseg.gob.ar' && userId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
      console.log('[NOTIFICACIONES] Corrigiendo ID de Maxi Scarimbolo en NotificationCenter:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
      userId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
    }
    
    // Inicializar un nuevo socket
    const newSocket = initializeSocket(userId);
    
    // Esperar un momento y solicitar notificaciones
    setTimeout(() => {
      if (newSocket.connected) {
        requestNotifications();
      }
    }, 1000);
  }, [currentUser, requestNotifications]);

  useEffect(() => {
    if (currentUser) {
      // Forzar el ID correcto para Ivan Zarate
      let userId = currentUser.id;
      if (currentUser.email === 'ivan.zarate@minseg.gob.ar' && userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
        console.log('[NOTIFICACIONES] Corrigiendo ID de Ivan Zarate en NotificationCenter:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
        userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
      }
      
      // Forzar el ID correcto para Maxi Scarimbolo
      if (currentUser.email === 'maxi.scarimbolo@minseg.gob.ar' && userId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
        console.log('[NOTIFICACIONES] Corrigiendo ID de Maxi Scarimbolo en NotificationCenter:', userId, '->', 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
        userId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
      }
      
      // Inicializar el socket cuando el usuario está autenticado
      const socket = initializeSocket(userId);
      
      console.log('[NOTIFICACIONES] Socket inicializado para usuario', userId);
      setSocketStatus('Conectando...');

      // Manejar la conexión
      socket.on('connect', () => {
        console.log('[NOTIFICACIONES] Socket conectado con ID:', socket.id);
        setSocketStatus('Conectado');
        setIsLoading(true);
        
        // Solicitar notificaciones al conectar
        socket.emit('get:unreadNotifications');
      });

      // Manejar la desconexión
      socket.on('disconnect', () => {
        console.log('[NOTIFICACIONES] Socket desconectado');
        setSocketStatus('Desconectado');
      });

      // Manejar errores
      socket.on('connect_error', (error) => {
        console.error('[NOTIFICACIONES] Error de conexión:', error);
        setSocketStatus(`Error: ${error.message}`);
        
        // Intentar reconectar después de un error (máximo 3 intentos)
        if (retryCount < 3) {
          setTimeout(() => {
            resetSocket();
          }, 5000);
        }
      });

      // Escuchar notificaciones no leídas
      socket.on('notification:unread', (unreadNotifications: Notification[]) => {
        setIsLoading(false);
        console.log('[NOTIFICACIONES] Recibidas notificaciones no leídas', unreadNotifications);
        if (unreadNotifications && Array.isArray(unreadNotifications) && unreadNotifications.length > 0) {
          setNotifications(prev => {
            // Combinar con notificaciones existentes, evitando duplicados
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = unreadNotifications.filter(n => !existingIds.has(n.id));
            return [...newNotifications, ...prev];
          });
          setUnreadCount(unreadNotifications.filter(n => !n.isRead).length);
        } else {
          console.log('[NOTIFICACIONES] No hay notificaciones no leídas');
        }
      });

      // Escuchar nuevas notificaciones
      socket.on('notification:new', (notification: Notification) => {
        console.log('[NOTIFICACIONES] Nueva notificación recibida', notification);
        if (notification && notification.id) {
          setNotifications(prev => {
            // Evitar duplicados
            if (prev.some(n => n.id === notification.id)) {
              return prev;
            }
            return [notification, ...prev];
          });
          if (!notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }
          
          // Mostrar una notificación del navegador si está permitido
          if (Notification.permission === 'granted') {
            try {
              new Notification('Nueva notificación', {
                body: notification.content
              });
            } catch (error) {
              console.error('[NOTIFICACIONES] Error al mostrar notificación del navegador:', error);
            }
          }
        }
      });

      // Solicitar permiso para notificaciones del navegador
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
      
      // Solicitar notificaciones inmediatamente y luego cada 30 segundos
      requestNotifications();
      const intervalId = setInterval(requestNotifications, 30000);

      return () => {
        // Limpiar los listeners cuando el componente se desmonta
        const socket = getSocket();
        if (socket) {
          console.log('[NOTIFICACIONES] Limpiando listeners de socket');
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('notification:unread');
          socket.off('notification:new');
          clearInterval(intervalId);
        }
      };
    }
  }, [currentUser, requestNotifications, resetSocket, retryCount]);

  const handleMarkAsRead = (notificationId: string) => {
    try {
      markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[NOTIFICACIONES] Error al marcar notificación como leída:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    try {
      notifications.forEach(n => {
        if (!n.isRead) {
          markNotificationAsRead(n.id);
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[NOTIFICACIONES] Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <FileText size={18} className="text-blue-500" />;
      case 'comment_added':
        return <MessageSquare size={18} className="text-green-500" />;
      case 'project_updated':
        return <Users size={18} className="text-purple-500" />;
      case 'wiki_edited':
        return <BookOpen size={18} className="text-amber-500" />;
      case 'project_added':
        return <Users size={18} className="text-indigo-500" />;
      case 'event_added':
        return <Calendar size={18} className="text-red-500" />;
      case 'document_uploaded':
        return <FileText size={18} className="text-orange-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return 'Fecha desconocida';
    
    try {
      const now = new Date();
      const notificationDate = new Date(date);
      const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Hace unos minutos';
      } else if (diffInHours < 24) {
        return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
      } else {
        return notificationDate.toLocaleDateString();
      }
    } catch (error) {
      console.error('[NOTIFICACIONES] Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  const handleRefreshNotifications = () => {
    resetSocket();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            <div className="flex space-x-2">
              <button
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                onClick={handleRefreshNotifications}
                title="Actualizar notificaciones"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin mr-1" />
                ) : (
                  <RefreshCw size={14} className="mr-1" />
                )}
                Actualizar
              </button>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>
          
          {socketStatus !== 'Conectado' && (
            <div className="p-2 bg-yellow-50 text-xs text-yellow-700 flex items-center justify-center">
              <WifiOff size={14} className="mr-1" />
              {socketStatus} - <button onClick={resetSocket} className="ml-1 underline">Reconectar</button>
            </div>
          )}
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No tienes notificaciones
                <div className="text-xs mt-1 text-gray-400">
                  Última actualización: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{notification.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-2 text-center text-xs text-gray-400">
                  Última actualización: {lastRefresh.toLocaleTimeString()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 