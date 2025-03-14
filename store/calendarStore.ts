import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent, EventAttachment, CalendarState } from '../types/calendar';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from '../lib/socket';
import { useUserStore } from './userStore';

// IDs correctos para usuarios conocidos
const IVAN_ID = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
const MAXI_ID = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

// Crear algunos eventos iniciales para demostración
const initialEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunión de inicio de proyecto',
    description: 'Reunión para discutir los objetivos y alcance del proyecto demo',
    startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    endDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    createdBy: '1', // ID del administrador
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 10)),
    type: 'meeting',
    projectId: '1',
    attendees: ['1', '2', '3'],
    attachments: [],
    color: '#4f46e5' // Indigo
  },
  {
    id: '2',
    title: 'Inicio de Proyecto Demo',
    description: 'Fecha de inicio oficial del proyecto demo',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    createdBy: '1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 40)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 40)),
    type: 'project',
    projectId: '1',
    attendees: [],
    attachments: [],
    color: '#10b981' // Emerald
  },
  {
    id: '3',
    title: 'Finalización de Proyecto Demo',
    description: 'Fecha estimada de finalización del proyecto demo',
    startDate: new Date(new Date().setDate(new Date().getDate() + 60)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 60)),
    createdBy: '1',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 40)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 40)),
    type: 'project',
    projectId: '1',
    attendees: [],
    attachments: [],
    color: '#10b981' // Emerald
  },
  {
    id: '4',
    title: 'Revisión de avance',
    description: 'Reunión para revisar el avance del proyecto y ajustar cronograma si es necesario',
    startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    createdBy: '2', // ID del gestor
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    type: 'meeting',
    projectId: '1',
    attendees: ['1', '2', '3'],
    attachments: [],
    color: '#4f46e5' // Indigo
  }
];

// Función para corregir IDs de usuario conocidos
const correctUserId = (userId: string): string => {
  if (!userId) return userId;
  
  // Corregir ID para Ivan Zarate
  if (userId !== IVAN_ID && 
      (userId.includes('ivan') || userId.includes('zarate') || 
       userId.toLowerCase().includes('ivan') || userId.toLowerCase().includes('zarate'))) {
    console.log('[CALENDAR] Corrigiendo ID de Ivan Zarate:', userId, '->', IVAN_ID);
    return IVAN_ID;
  }
  
  // Corregir ID para Maxi Scarimbolo
  if (userId !== MAXI_ID && 
      (userId.includes('maxi') || userId.includes('scarimbolo') || 
       userId.toLowerCase().includes('maxi') || userId.toLowerCase().includes('scarimbolo'))) {
    console.log('[CALENDAR] Corrigiendo ID de Maxi Scarimbolo:', userId, '->', MAXI_ID);
    return MAXI_ID;
  }
  
  return userId;
};

// Función segura para enviar notificaciones
const safeNotify = (notification: any) => {
  try {
    sendNotification(notification);
  } catch (error) {
    console.error('[CALENDAR] Error al enviar notificación:', error);
  }
};

// Referencia al store de proyectos para evitar importación circular
let projectStore: any = null;

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: initialEvents,
      
      addEvent: (eventData) => {
        const now = new Date();
        const newEvent: CalendarEvent = {
          ...eventData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          events: [...state.events, newEvent]
        }));
        
        // Enviar notificación a todos los usuarios cuando se añade un evento
        try {
          const currentUser = useUserStore.getState().currentUser;
          if (currentUser) {
            // Obtener todos los usuarios
            const allUsers = useUserStore.getState().users;
            
            // Si el evento está asociado a un proyecto, notificar solo a los miembros del proyecto
            if (newEvent.projectId) {
              // Intentar obtener el store de proyectos si no lo tenemos ya
              if (!projectStore) {
                try {
                  // Importar de forma segura
                  const projectModule = require('./projectStore');
                  projectStore = projectModule.useProjectStore;
                } catch (error) {
                  console.error('[CALENDAR] Error al importar projectStore:', error);
                }
              }
              
              if (projectStore) {
                const project = projectStore.getState().getProjectById(newEvent.projectId);
                if (project && project.members) {
                  project.members.forEach((memberId: string) => {
                    // Corregir el ID del miembro si es necesario
                    const correctedMemberId = correctUserId(memberId);
                    
                    if (correctedMemberId && correctedMemberId !== currentUser.id) {
                      console.log(`[CALENDAR] Enviando notificación de evento de proyecto a: ${correctedMemberId}`);
                      safeNotify({
                        type: 'event_added',
                        content: `${currentUser.firstName} ${currentUser.lastName} ha añadido un evento "${newEvent.title}" al calendario del proyecto "${project.name}"`,
                        fromUserId: currentUser.id,
                        toUserId: correctedMemberId
                      });
                    }
                  });
                }
              }
            } else {
              // Si es un evento general, notificar a todos los usuarios
              allUsers.forEach(user => {
                if (!user || !user.id) return;
                
                // Corregir el ID del usuario si es necesario
                const correctedUserId = correctUserId(user.id);
                
                if (correctedUserId && correctedUserId !== currentUser.id) {
                  console.log(`[CALENDAR] Enviando notificación de evento general a: ${correctedUserId} (${user.firstName} ${user.lastName})`);
                  safeNotify({
                    type: 'event_added',
                    content: `${currentUser.firstName} ${currentUser.lastName} ha añadido un evento "${newEvent.title}" al calendario general`,
                    fromUserId: currentUser.id,
                    toUserId: correctedUserId
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error('[CALENDAR] Error al procesar notificaciones:', error);
        }
        
        return newEvent;
      },
      
      updateEvent: (id, eventData) => {
        const { events } = get();
        const eventIndex = events.findIndex(event => event.id === id);
        
        if (eventIndex === -1) return null;
        
        const updatedEvent = {
          ...events[eventIndex],
          ...eventData,
          updatedAt: new Date()
        };
        
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = updatedEvent;
        
        set({ events: updatedEvents });
        
        return updatedEvent;
      },
      
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter(event => event.id !== id)
        }));
      },
      
      getEventById: (id) => {
        return get().events.find(event => event.id === id);
      },
      
      getEventsByUser: (userId) => {
        const correctedUserId = correctUserId(userId);
        return get().events.filter(event => 
          event.createdBy === correctedUserId || 
          (event.attendees && event.attendees.includes(correctedUserId))
        );
      },
      
      getEventsByProject: (projectId) => {
        return get().events.filter(event => event.projectId === projectId);
      },
      
      getEventsByDateRange: (startDate, endDate) => {
        return get().events.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          
          return (
            (eventStart >= startDate && eventStart <= endDate) || // Evento comienza en el rango
            (eventEnd >= startDate && eventEnd <= endDate) || // Evento termina en el rango
            (eventStart <= startDate && eventEnd >= endDate) // Evento abarca todo el rango
          );
        });
      },
      
      addAttachment: (eventId, attachmentData) => {
        const { events } = get();
        const eventIndex = events.findIndex(event => event.id === eventId);
        
        if (eventIndex === -1) return null;
        
        const newAttachment: EventAttachment = {
          ...attachmentData,
          id: uuidv4(),
          uploadedAt: new Date()
        };
        
        const updatedEvent = {
          ...events[eventIndex],
          attachments: [...(events[eventIndex].attachments || []), newAttachment],
          updatedAt: new Date()
        };
        
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = updatedEvent;
        
        set({ events: updatedEvents });
        
        return newAttachment;
      },
      
      deleteAttachment: (eventId, attachmentId) => {
        const { events } = get();
        const eventIndex = events.findIndex(event => event.id === eventId);
        
        if (eventIndex === -1) return;
        
        const updatedEvent = {
          ...events[eventIndex],
          attachments: (events[eventIndex].attachments || []).filter(
            attachment => attachment.id !== attachmentId
          ),
          updatedAt: new Date()
        };
        
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = updatedEvent;
        
        set({ events: updatedEvents });
      }
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({ events: state.events })
    }
  )
); 