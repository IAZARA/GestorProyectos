import { User } from './user';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  type: EventType;
  projectId?: string;
  attendees: string[]; // IDs de usuarios
  attachments: EventAttachment[];
  color?: string;
}

export type EventType = 'project' | 'meeting' | 'other';

export interface EventAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CalendarState {
  events: CalendarEvent[];
  
  // Acciones
  addEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent;
  updateEvent: (id: string, eventData: Partial<CalendarEvent>) => CalendarEvent | null;
  deleteEvent: (id: string) => void;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsByUser: (userId: string) => CalendarEvent[];
  getEventsByProject: (projectId: string) => CalendarEvent[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  
  // Acciones para adjuntos
  addAttachment: (eventId: string, attachmentData: Omit<EventAttachment, 'id' | 'uploadedAt'>) => EventAttachment | null;
  deleteAttachment: (eventId: string, attachmentId: string) => void;
} 