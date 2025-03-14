import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Task, Comment, ProjectStatus, Attachment, ProjectPriority } from '../types/project';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from '../lib/socket';
import { useUserStore } from './userStore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  
  // Acciones para proyectos
  addProject: (projectData: Omit<Project, 'id' | 'tasks' | 'comments' | 'attachments' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, projectData: Partial<Project>) => Project | null;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByMember: (userId: string) => Project[];
  setCurrentProject: (id: string) => void;
  
  // Acciones para tareas
  addTask: (projectId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task | null;
  updateTask: (projectId: string, taskId: string, taskData: Partial<Task>) => Task | null;
  deleteTask: (projectId: string, taskId: string) => void;
  
  // Acciones para comentarios
  addComment: (projectId: string, commentData: Omit<Comment, 'id' | 'createdAt'>) => Comment | null;
  deleteComment: (projectId: string, commentId: string) => void;
  
  // Acciones para archivos adjuntos
  addAttachment: (projectId: string, attachmentData: Omit<Attachment, 'id' | 'createdAt'>) => Attachment | null;
  deleteAttachment: (projectId: string, attachmentId: string) => void;
}

// Crear algunos proyectos iniciales para demostración
const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Proyecto Demo',
    description: 'Este es un proyecto de demostración',
    status: 'En_Progreso',
    startDate: new Date('2023-01-01'),
    createdBy: '1', // ID del administrador
    members: ['1', '2', '3'], // Todos los usuarios
    tasks: [
      {
        id: '1',
        title: 'Tarea de ejemplo',
        description: 'Esta es una tarea de ejemplo',
        status: 'En Progreso',
        assignedTo: '3',
        createdBy: '2',
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      }
    ],
    comments: [
      {
        id: '1',
        content: 'Este es un comentario de ejemplo',
        userId: '1',
        createdAt: new Date('2023-01-03')
      }
    ],
    attachments: [
      {
        id: '1',
        fileName: 'documento-ejemplo',
        originalName: 'Documento de ejemplo.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1MB
        path: '#',
        userId: '1',
        projectId: '1',
        createdAt: new Date('2023-01-04')
      }
    ],
    wikiContent: '# Proyecto Demo\n\nEste es un ejemplo de contenido wiki para el proyecto de demostración.\n\n## Objetivos\n\n- Mostrar las funcionalidades del sistema\n- Servir como ejemplo para los usuarios',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    priority: 'Media'
  }
];

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: initialProjects,
      currentProject: null,
      
      addProject: (projectData) => {
        const now = new Date();
        const newProject: Project = {
          ...projectData,
          id: uuidv4(),
          tasks: [],
          comments: [],
          attachments: [],
          createdAt: now,
          updatedAt: now,
          priority: projectData.priority || 'Media',
          status: projectData.status || 'Pendiente'
        };
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
        
        // Obtener el usuario actual
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser) {
          console.log(`[PROYECTO] Creando proyecto por usuario: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.id})`);
          
          // Corregir el ID del creador si es necesario
          let fromUserId = currentUser.id;
          
          // Corregir ID de Ivan Zarate si es necesario
          if (currentUser.email === 'ivan.zarate@minseg.gob.ar' && fromUserId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
            console.log(`[PROYECTO] Corrigiendo ID de Ivan Zarate: ${fromUserId} -> 857af152-2fd5-4a4b-a8cb-468fc2681f5c`);
            fromUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
          }
          
          // Corregir ID de Maxi Scarimbolo si es necesario
          if (currentUser.email === 'maxi.scarimbolo@minseg.gob.ar' && fromUserId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
            console.log(`[PROYECTO] Corrigiendo ID de Maxi Scarimbolo: ${fromUserId} -> e3fc93f9-9941-4840-ac2c-a30a7fcd322f`);
            fromUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
          }
          
          // Notificar a todos los miembros del proyecto excepto al creador
          if (newProject.members && Array.isArray(newProject.members)) {
            newProject.members.forEach(memberId => {
              // Corregir ID de miembro si es necesario
              let toUserId = memberId;
              
              // Verificar si el miembro es Ivan Zarate y corregir su ID si es necesario
              const memberUser = useUserStore.getState().getUserById(memberId);
              if (memberUser && memberUser.email === 'ivan.zarate@minseg.gob.ar' && toUserId !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
                console.log(`[PROYECTO] Corrigiendo ID de miembro Ivan Zarate: ${toUserId} -> 857af152-2fd5-4a4b-a8cb-468fc2681f5c`);
                toUserId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
              }
              
              // Verificar si el miembro es Maxi Scarimbolo y corregir su ID si es necesario
              if (memberUser && memberUser.email === 'maxi.scarimbolo@minseg.gob.ar' && toUserId !== 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f') {
                console.log(`[PROYECTO] Corrigiendo ID de miembro Maxi Scarimbolo: ${toUserId} -> e3fc93f9-9941-4840-ac2c-a30a7fcd322f`);
                toUserId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';
              }
              
              if (toUserId !== fromUserId) {
                console.log(`[PROYECTO] Enviando notificación de nuevo proyecto a usuario ${toUserId}`);
                sendNotification({
                  type: 'project_added',
                  content: `${currentUser.firstName} ${currentUser.lastName} te ha añadido al proyecto "${newProject.name}"`,
                  fromUserId: currentUser.id,
                  toUserId: toUserId
                });
              }
            });
          }
        }
        
        return newProject;
      },
      
      updateProject: (id, projectData) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === id);
        
        if (projectIndex === -1) return null;
        
        const originalProject = projects[projectIndex];
        const updatedProject = {
          ...originalProject,
          ...projectData,
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === id ? updatedProject : get().currentProject
        });
        
        // Obtener el usuario actual
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser) {
          // Verificar si se ha editado la wiki
          if (projectData.wikiContent && projectData.wikiContent !== originalProject.wikiContent) {
            // Notificar a todos los miembros del proyecto excepto al editor
            updatedProject.members.forEach(memberId => {
              if (memberId !== currentUser.id) {
                sendNotification({
                  type: 'wiki_edited',
                  content: `${currentUser.firstName} ${currentUser.lastName} ha editado la wiki del proyecto "${updatedProject.name}"`,
                  fromUserId: currentUser.id,
                  toUserId: memberId
                });
              }
            });
          }
          
          // Verificar si se han añadido nuevos miembros al proyecto
          if (projectData.members && Array.isArray(projectData.members)) {
            const newMembers = projectData.members.filter(
              memberId => !originalProject.members.includes(memberId)
            );
            
            // Si el usuario actual es gestor o administrador, notificar a los nuevos miembros
            if ((currentUser.role === 'Gestor' || currentUser.role === 'Administrador') && newMembers.length > 0) {
              newMembers.forEach(newMemberId => {
                sendNotification({
                  type: 'project_member_added',
                  content: `${currentUser.firstName} ${currentUser.lastName} te ha añadido al proyecto "${updatedProject.name}"`,
                  fromUserId: currentUser.id,
                  toUserId: newMemberId
                });
              });
            }
          }
          
          // Notificación general de actualización del proyecto (para cambios que no sean wiki o miembros)
          if (!projectData.wikiContent && !projectData.members) {
            updatedProject.members.forEach(memberId => {
              if (memberId !== currentUser.id) {
                sendNotification({
                  type: 'project_updated',
                  content: `${currentUser.firstName} ${currentUser.lastName} ha actualizado el proyecto "${updatedProject.name}"`,
                  fromUserId: currentUser.id,
                  toUserId: memberId
                });
              }
            });
          }
        }
        
        return updatedProject;
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter(project => project.id !== id),
          // Si el proyecto eliminado es el proyecto actual, lo reseteamos
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        }));
      },
      
      getProjectById: (id) => {
        return get().projects.find(project => project.id === id);
      },
      
      getProjectsByMember: (userId) => {
        return get().projects.filter(project => project.members.includes(userId));
      },
      
      setCurrentProject: (id) => {
        const project = get().projects.find(project => project.id === id);
        set({ currentProject: project || null });
      },
      
      addTask: (projectId, taskData) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return null;
        
        const now = new Date();
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        
        const updatedProject = {
          ...projects[projectIndex],
          tasks: [...projects[projectIndex].tasks, newTask],
          updatedAt: now
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
        
        // Enviar notificación si la tarea está asignada a alguien
        if (newTask.assignedTo && newTask.createdBy) {
          const currentUser = useUserStore.getState().currentUser;
          if (currentUser) {
            const project = projects[projectIndex];
            sendNotification({
              type: 'task_assigned',
              content: `Se te ha asignado una nueva tarea: "${newTask.title}" en el proyecto "${project.name}"`,
              fromUserId: currentUser.id,
              toUserId: newTask.assignedTo
            });
          }
        }
        
        return newTask;
      },
      
      updateTask: (projectId, taskId, taskData) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return null;
        
        const taskIndex = projects[projectIndex].tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return null;
        
        const updatedTask = {
          ...projects[projectIndex].tasks[taskIndex],
          ...taskData,
          updatedAt: new Date()
        };
        
        const updatedTasks = [...projects[projectIndex].tasks];
        updatedTasks[taskIndex] = updatedTask;
        
        const updatedProject = {
          ...projects[projectIndex],
          tasks: updatedTasks,
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
        
        return updatedTask;
      },
      
      deleteTask: (projectId, taskId) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return;
        
        const updatedProject = {
          ...projects[projectIndex],
          tasks: projects[projectIndex].tasks.filter(task => task.id !== taskId),
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
      },
      
      addComment: (projectId, commentData) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return null;
        
        const newComment: Comment = {
          ...commentData,
          id: uuidv4(),
          createdAt: new Date()
        };
        
        const updatedProject = {
          ...projects[projectIndex],
          comments: [...projects[projectIndex].comments, newComment],
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
        
        // Enviar notificación a todos los miembros del proyecto excepto al autor del comentario
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser) {
          const project = projects[projectIndex];
          project.members.forEach(memberId => {
            if (memberId !== currentUser.id) {
              sendNotification({
                type: 'comment_added',
                content: `${currentUser.firstName} ${currentUser.lastName} ha comentado en el proyecto "${project.name}"`,
                fromUserId: currentUser.id,
                toUserId: memberId
              });
            }
          });
        }
        
        return newComment;
      },
      
      deleteComment: (projectId, commentId) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return;
        
        const updatedProject = {
          ...projects[projectIndex],
          comments: projects[projectIndex].comments.filter(comment => comment.id !== commentId),
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
      },
      
      // Nuevas acciones para archivos adjuntos
      addAttachment: (projectId, attachmentData) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return null;
        
        const newAttachment: Attachment = {
          ...attachmentData,
          id: uuidv4(),
          createdAt: new Date()
        };
        
        const updatedProject = {
          ...projects[projectIndex],
          attachments: [...projects[projectIndex].attachments, newAttachment],
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
        
        return newAttachment;
      },
      
      deleteAttachment: (projectId, attachmentId) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return;
        
        const updatedProject = {
          ...projects[projectIndex],
          attachments: projects[projectIndex].attachments.filter(attachment => attachment.id !== attachmentId),
          updatedAt: new Date()
        };
        
        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = updatedProject;
        
        set({ 
          projects: updatedProjects,
          currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
        });
      }
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ projects: state.projects })
    }
  )
); 