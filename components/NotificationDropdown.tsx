import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, deleteNotification } = useNotificationStore();
  const { currentUser } = useUserStore();
  
  // Filtrar notificaciones para el usuario actual
  const userNotifications = currentUser 
    ? notifications.filter(notification => notification.toId === currentUser.id)
    : [];
  
  const unreadCount = userNotifications.filter(notification => !notification.read).length;
  
  console.log('[NotificationDropdown] Usuario actual:', currentUser?.id);
  console.log('[NotificationDropdown] Total de notificaciones:', notifications.length);
  console.log('[NotificationDropdown] Notificaciones del usuario:', userNotifications.length);
  console.log('[NotificationDropdown] Notificaciones sin leer:', unreadCount);
  
  // Ordenar notificaciones por fecha (más recientes primero)
  const sortedNotifications = [...userNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
    } catch (error) {
      console.error('[NotificationDropdown] Error al formatear fecha:', error);
      return 'fecha desconocida';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={handleToggle}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600 cursor-pointer hover:text-blue-800"
                onClick={() => userNotifications.forEach(n => !n.read && markAsRead(n.id))}>
                Marcar todas como leídas
              </span>
            )}
          </div>
          
          {sortedNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tienes notificaciones
            </div>
          ) : (
            <div>
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{notification.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        De: {notification.fromId} - Para: {notification.toId}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Leído
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 