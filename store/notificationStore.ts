import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from '../lib/socket';
import { getStorage, setStorage } from '../lib/storage';

// Definición de tipos
export interface Notification {
  id: string;
  type: string;
  content: string;
  fromId: string;
  toId: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface NotificationCache {
  data: Notification[];
  userId: string;
  timestamp: number;
}

export interface NotificationState {
  notifications: Notification[];
  initializeNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'read'>) => Promise<Notification>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getNotificationsForUser: (userId: string) => Notification[];
  getUnreadNotificationsForUser: (userId: string) => Notification[];
  getUnreadCountForUser: (userId: string) => number;
  fetchNotificationsFromServer: (userId: string) => Promise<void>;
}

// IDs correctos para usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Función para corregir IDs de usuario conocidos
const correctUserId = (userId: string): string => {
  // Corregir ID para Ivan Zarate
  if (userId !== IVAN_ID && 
      (userId.includes('ivan') || userId.includes('zarate') || 
       userId.toLowerCase().includes('ivan') || userId.toLowerCase().includes('zarate'))) {
    console.log('[NOTIFICATION] Corrigiendo ID de Ivan Zarate:', userId, '->', IVAN_ID);
    return IVAN_ID;
  }
  
  // Corregir ID para Maxi Scarimbolo
  if (userId !== MAXI_ID && 
      (userId.includes('maxi') || userId.includes('scarimbolo') || 
       userId.toLowerCase().includes('maxi') || userId.toLowerCase().includes('scarimbolo'))) {
    console.log('[NOTIFICATION] Corrigiendo ID de Maxi Scarimbolo:', userId, '->', MAXI_ID);
    return MAXI_ID;
  }
  
  return userId;
};

// Función para convertir nombres de campos de snake_case a camelCase
const snakeToCamel = (notification: any): Notification => {
  return {
    id: notification.id,
    type: notification.type,
    content: notification.content,
    fromId: notification.from_id || notification.fromId,
    toId: notification.to_id || notification.toId,
    isRead: notification.is_read || notification.isRead || notification.read || false,
    createdAt: new Date(notification.created_at || notification.createdAt),
    updatedAt: notification.updated_at || notification.updatedAt ? new Date(notification.updated_at || notification.updatedAt) : undefined
  };
};

// Función para convertir nombres de campos de camelCase a snake_case
const camelToSnake = (notification: any) => {
  return {
    id: notification.id,
    type: notification.type,
    content: notification.content,
    from_id: notification.fromId,
    to_id: notification.toId,
    is_read: notification.isRead,
    created_at: notification.createdAt,
    updated_at: notification.updatedAt
  };
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      // Inicializar el store con notificaciones desde el servidor
      initializeNotifications: (notifications: Notification[]) => {
        console.log('[NOTIFICATION] Inicializando notificaciones:', notifications.length);
        set({ notifications });
      },
      
      // Añadir una nueva notificación
      addNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'read'>) => {
        const now = new Date();
        const newNotification: Notification = {
          id: uuidv4(),
          ...notification,
          // Corregir IDs de usuario
          fromId: correctUserId(notification.fromId),
          toId: correctUserId(notification.toId),
          isRead: false,
          createdAt: now,
          updatedAt: now
        };
        
        console.log('[NOTIFICATION] Añadiendo notificación:', newNotification);
        
        // Guardar en el estado local
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));
        
        // Enviar la notificación a través del socket
        sendNotification(newNotification);
        
        // Guardar en la base de datos
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(camelToSnake(newNotification)),
            });
            
            if (!response.ok) {
              throw new Error(`Error al guardar notificación: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[NOTIFICATION] Notificación guardada en la base de datos:', data);
          } catch (error) {
            console.error('[NOTIFICATION] Error al guardar notificación en la base de datos:', error);
          }
        }
        
        return newNotification;
      },
      
      // Marcar una notificación como leída
      markAsRead: async (id: string) => {
        console.log('[NOTIFICATION] Marcando notificación como leída:', id);
        
        // Actualizar en el estado local
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true, updatedAt: new Date() }
              : notification
          )
        }));
        
        // Actualizar en la base de datos
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch(`/api/notifications/${id}/read`, {
              method: 'PUT',
            });
            
            if (!response.ok) {
              throw new Error(`Error al marcar notificación como leída: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[NOTIFICATION] Notificación marcada como leída en la base de datos:', data);
          } catch (error) {
            console.error('[NOTIFICATION] Error al marcar notificación como leída en la base de datos:', error);
          }
        }
      },
      
      // Marcar todas las notificaciones como leídas
      markAllAsRead: async (userId: string) => {
        console.log('[NOTIFICATION] Marcando todas las notificaciones como leídas para usuario:', userId);
        
        const correctedUserId = correctUserId(userId);
        
        // Actualizar en el estado local
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.toId === correctedUserId
              ? { ...notification, isRead: true, updatedAt: new Date() }
              : notification
          )
        }));
        
        // Actualizar en la base de datos
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch(`/api/notifications/read-all?userId=${correctedUserId}`, {
              method: 'PUT',
            });
            
            if (!response.ok) {
              throw new Error(`Error al marcar todas las notificaciones como leídas: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[NOTIFICATION] Todas las notificaciones marcadas como leídas en la base de datos:', data);
          } catch (error) {
            console.error('[NOTIFICATION] Error al marcar todas las notificaciones como leídas en la base de datos:', error);
          }
        }
      },
      
      // Eliminar una notificación
      deleteNotification: async (id: string) => {
        console.log('[NOTIFICATION] Eliminando notificación:', id);
        
        // Eliminar del estado local
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id)
        }));
        
        // Eliminar de la base de datos
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch(`/api/notifications/${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error(`Error al eliminar notificación: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[NOTIFICATION] Notificación eliminada de la base de datos:', data);
          } catch (error) {
            console.error('[NOTIFICATION] Error al eliminar notificación de la base de datos:', error);
          }
        }
      },
      
      // Obtener notificaciones para un usuario específico
      getNotificationsForUser: (userId: string) => {
        const correctedUserId = correctUserId(userId);
        return get().notifications.filter((notification) => notification.toId === correctedUserId);
      },
      
      // Obtener notificaciones no leídas para un usuario específico
      getUnreadNotificationsForUser: (userId: string) => {
        const correctedUserId = correctUserId(userId);
        return get().notifications.filter(
          (notification) => notification.toId === correctedUserId && !notification.isRead
        );
      },
      
      // Obtener el conteo de notificaciones no leídas para un usuario específico
      getUnreadCountForUser: (userId: string) => {
        const correctedUserId = correctUserId(userId);
        return get().notifications.filter(
          (notification) => notification.toId === correctedUserId && !notification.isRead
        ).length;
      },
      
      // Cargar notificaciones desde el servidor
      fetchNotificationsFromServer: async (userId: string) => {
        console.log('[NOTIFICATION] Cargando notificaciones desde el servidor para usuario:', userId);
        
        const correctedUserId = correctUserId(userId);
        
        if (typeof window !== 'undefined') {
          try {
            const response = await fetch(`/api/notifications?userId=${correctedUserId}`);
            
            if (!response.ok) {
              throw new Error(`Error al cargar notificaciones: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && Array.isArray(data)) {
              // Convertir de snake_case a camelCase
              const notifications = data.map(snakeToCamel);
              
              console.log('[NOTIFICATION] Notificaciones cargadas desde el servidor:', notifications.length);
              set({ notifications });
              
              // Guardar en localStorage para acceso rápido
              await setStorage<NotificationCache>('notifications', {
                data: notifications,
                userId: correctedUserId,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error('[NOTIFICATION] Error al cargar notificaciones desde el servidor:', error);
            
            // Intentar cargar desde localStorage
            try {
              const cachedData = await getStorage<NotificationCache>('notifications');
              if (cachedData && cachedData.userId === correctedUserId) {
                console.log('[NOTIFICATION] Usando notificaciones en caché:', cachedData.data.length);
                set({ notifications: cachedData.data });
              }
            } catch (cacheError) {
              console.error('[NOTIFICATION] Error al cargar notificaciones desde caché:', cacheError);
            }
          }
        }
      }
    }),
    {
      name: 'notification-storage',
    }
  )
); 