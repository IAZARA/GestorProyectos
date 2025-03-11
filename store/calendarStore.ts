import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent, EventAttachment, CalendarState } from '../types/calendar';
import { v4 as uuidv4 } from 'uuid';

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
        return get().events.filter(event => 
          event.createdBy === userId || event.attendees.includes(userId)
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
          attachments: [...events[eventIndex].attachments, newAttachment],
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
          attachments: events[eventIndex].attachments.filter(
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