import { User } from './user';

export type ProjectStatus = 'Pendiente' | 'En_Progreso' | 'Completado';
export type TaskStatus = 'Por Hacer' | 'En Progreso' | 'En Revision' | 'Completado';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string; // ID del usuario asignado
  createdBy: string; // ID del usuario que creó la tarea
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string; // ID del usuario que hizo el comentario
  createdAt: Date;
}

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  userId: string; // ID del usuario que subió el archivo
  projectId?: string;
  taskId?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  createdBy: string; // ID del usuario que creó el proyecto
  members: string[]; // IDs de los usuarios miembros del proyecto
  tasks: Task[];
  comments: Comment[];
  attachments: Attachment[];
  wikiContent?: string; // Contenido de la wiki del proyecto
  createdAt: Date;
  updatedAt: Date;
} 