'use client';
import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { initializeSocket, getSocket, markNotificationAsRead } from '../../lib/socket';
import { Bell, Calendar, MessageSquare, FileText, Users, BookOpen } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  content: string;
  fromId: string;
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

  useEffect(() => {
    if (currentUser) {
      // Forzar el ID correcto para Ivan Zarate
      let userId = currentUser.id;
      if (currentUser.email === 'ivan.zarate@minseg.gob.ar' && userId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
        console.log('Corrigiendo ID de Ivan Zarate en NotificationCenter:', userId, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
        userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
      }
      
      // Inicializar el socket cuando el usuario está autenticado
      const socket = initializeSocket(userId);
      
      console.log('NotificationCenter: Socket inicializado para usuario', userId);
      setSocketStatus('Conectando...');

      // Manejar la conexión
      socket.on('connect', () => {
        console.log('NotificationCenter: Socket conectado con ID:', socket.id);
        setSocketStatus('Conectado');
      });

      // Manejar la desconexión
      socket.on('disconnect', () => {
        console.log('NotificationCenter: Socket desconectado');
        setSocketStatus('Desconectado');
      });

      // Manejar errores
      socket.on('connect_error', (error) => {
        console.error('NotificationCenter: Error de conexión:', error);
        setSocketStatus(`Error: ${error.message}`);
      });

      // Escuchar notificaciones no leídas
      socket.on('notification:unread', (unreadNotifications: Notification[]) => {
        console.log('NotificationCenter: Recibidas notificaciones no leídas', unreadNotifications);
        if (unreadNotifications && unreadNotifications.length > 0) {
          setNotifications(prev => {
            // Combinar con notificaciones existentes, evitando duplicados
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifications = unreadNotifications.filter(n => !existingIds.has(n.id));
            return [...newNotifications, ...prev];
          });
          setUnreadCount(unreadNotifications.length);
        } else {
          console.log('NotificationCenter: No hay notificaciones no leídas');
        }
      });

      // Escuchar nuevas notificaciones
      socket.on('notification:new', (notification: Notification) => {
        console.log('NotificationCenter: Nueva notificación recibida', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Mostrar una notificación del navegador si está permitido
        if (Notification.permission === 'granted') {
          new Notification('Nueva notificación', {
            body: notification.content
          });
        }
      });

      // Solicitar permiso para notificaciones del navegador
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      // Forzar una solicitud de notificaciones no leídas
      const requestNotifications = () => {
        if (socket.connected) {
          console.log('NotificationCenter: Solicitando notificaciones no leídas manualmente');
          socket.emit('get:unreadNotifications');
        } else {
          console.log('NotificationCenter: No se pueden solicitar notificaciones, socket desconectado');
        }
      };
      
      // Solicitar notificaciones inmediatamente y luego cada 10 segundos
      setTimeout(requestNotifications, 2000);
      const intervalId = setInterval(requestNotifications, 10000);

      return () => {
        // Limpiar los listeners cuando el componente se desmonta
        const socket = getSocket();
        if (socket) {
          console.log('NotificationCenter: Limpiando listeners de socket');
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('notification:unread');
          socket.off('notification:new');
          clearInterval(intervalId);
        }
      };
    }
  }, [currentUser]);

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) {
        markNotificationAsRead(n.id);
      }
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
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
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No tienes notificaciones
              </div>
            ) : (
              notifications.map(notification => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 