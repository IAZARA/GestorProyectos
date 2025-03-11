'use client';
import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { initializeSocket, getSocket, markNotificationAsRead } from '../../lib/socket';
import { Bell } from 'lucide-react';

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

  useEffect(() => {
    if (currentUser) {
      // Inicializar el socket cuando el usuario está autenticado
      const socket = initializeSocket(currentUser.id);

      // Escuchar notificaciones no leídas
      socket.on('notification:unread', (unreadNotifications: Notification[]) => {
        setNotifications(prev => {
          // Combinar con notificaciones existentes, evitando duplicados
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = unreadNotifications.filter(n => !existingIds.has(n.id));
          return [...newNotifications, ...prev];
        });
        setUnreadCount(unreadNotifications.length);
      });

      // Escuchar nuevas notificaciones
      socket.on('notification:new', (notification: Notification) => {
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

      return () => {
        // Limpiar los listeners cuando el componente se desmonta
        const socket = getSocket();
        if (socket) {
          socket.off('notification:unread');
          socket.off('notification:new');
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
        return '📋';
      case 'comment_added':
        return '💬';
      case 'project_updated':
        return '📊';
      default:
        return '🔔';
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