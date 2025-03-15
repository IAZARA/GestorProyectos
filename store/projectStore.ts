import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Task, Comment, ProjectStatus, Attachment, ProjectPriority } from '../types/project';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from '../lib/socket';
import { useUserStore } from './userStore';
import { getProjects as apiGetProjects, deleteProject as apiDeleteProject, createProject as apiCreateProject, updateProject as apiUpdateProject, addProjectMembers as apiAddProjectMembers, removeProjectMembers as apiRemoveProjectMembers } from '../lib/api';
import { enhancedStorage } from '../lib/localStorage';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  
  // Acciones para proyectos
  fetchProjects: () => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'tasks' | 'comments' | 'attachments' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByMember: (userId: string) => Project[];
  setCurrentProject: (id: string) => void;
  clearCurrentProject: () => void;
  addProjectMembers: (projectId: string, memberIds: string[]) => Promise<Project | null>;
  removeProjectMembers: (projectId: string, memberIds: string[]) => Promise<Project | null>;
  
  // Acciones para tareas
  addTask: (projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (projectId: string, taskId: string, taskData: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  
  // Acciones para comentarios
  addComment: (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  deleteComment: (projectId: string, commentId: string) => void;
  
  // Acciones para archivos adjuntos
  addAttachment: (projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
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

// Función auxiliar para sincronizar explícitamente el store
export const syncProjectStore = () => {
  const { projects } = useProjectStore.getState();
  useProjectStore.setState({ projects: [...projects] });
  console.log("Store sincronizado globalmente - Proyectos guardados:", projects.length);
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: initialProjects,
      currentProject: null,
      isLoading: false,
      
      fetchProjects: async () => {
        set({ isLoading: true });
        try {
          const projects = await apiGetProjects();
          set({ projects, isLoading: false });
        } catch (error) {
          console.error(error);
          set({ isLoading: false });
        }
      },
      
      addProject: async (projectData) => {
        try {
          const currentUser = useUserStore.getState().currentUser;
          
          if (!currentUser) {
            console.error('No hay usuario autenticado para crear el proyecto');
            throw new Error('No hay usuario autenticado');
          }
          
          console.log('Creando proyecto en el servidor:', projectData);
          
          // Crear el proyecto en el servidor
          const createdProject = await apiCreateProject({
            ...projectData,
            createdById: currentUser.id,
            // Asegurarse de que el creador sea miembro del proyecto
            members: [...(projectData.members || []), currentUser.id]
          });
          
          console.log('Proyecto creado en el servidor:', createdProject);
          
          // Actualizar el estado local con el proyecto creado
          set((state) => ({
            projects: [...state.projects, createdProject]
          }));
          
          return createdProject;
        } catch (error) {
          console.error('Error al crear el proyecto:', error);
          throw error;
        }
      },
      
      updateProject: async (id, projectData) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === id);
          
          if (projectIndex === -1) return null;
          
          console.log('Actualizando proyecto en el servidor:', id, projectData);
          
          // Actualizar el proyecto en el servidor
          const updatedProjectFromServer = await apiUpdateProject(id, projectData);
          
          if (!updatedProjectFromServer) {
            console.error('No se pudo actualizar el proyecto en el servidor');
            
            // Modo offline: Actualizar localmente si la API falló
            console.log('Actualizando proyecto localmente (modo offline)');
            
            // Crear una versión actualizada del proyecto
            const originalProject = projects[projectIndex];
            const updatedProject = {
              ...originalProject,
              ...projectData,
              updatedAt: new Date()
            };
            
            // Actualizar el estado
            const updatedProjects = [...projects];
            updatedProjects[projectIndex] = updatedProject;
            
            set({
              projects: updatedProjects,
              currentProject: get().currentProject?.id === id ? updatedProject : get().currentProject
            });
            
            // Forzar una sincronización para que persista
            setTimeout(() => {
              syncProjectStore();
            }, 100);
            
            return updatedProject;
          }
          
          console.log('Proyecto actualizado en el servidor:', updatedProjectFromServer);
          
          // Actualizar el estado local con los datos del servidor
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProjectFromServer;
          
          set({
            projects: updatedProjects,
            currentProject: get().currentProject?.id === id ? updatedProjectFromServer : get().currentProject
          });
          
          // Forzar una actualización cuando se modifican miembros
          if (projectData.members && get().currentProject?.id === id) {
            // Actualizar el estado para forzar que los componentes se refresquen
            set(state => ({...state}));
          }
          
          // Forzar una sincronización para que persista
          setTimeout(() => {
            syncProjectStore();
          }, 100);
          
          // Notificar a los miembros del proyecto sobre la actualización
          const currentUser = useUserStore.getState().currentUser;
          
          if (currentUser && updatedProjectFromServer.members) {
            updatedProjectFromServer.members.forEach(memberId => {
              if (memberId !== currentUser.id) {
                sendNotification({
                  type: 'project_updated',
                  content: `${currentUser.firstName} ${currentUser.lastName} ha actualizado el proyecto "${updatedProjectFromServer.name}"`,
                  fromUserId: currentUser.id,
                  toUserId: memberId
                });
              }
            });
          }
          
          return updatedProjectFromServer;
        } catch (error) {
          console.error('Error al actualizar el proyecto:', error);
          return null;
        }
      },
      
      deleteProject: async (id) => {
        try {
          // Primero, eliminar el proyecto en el servidor
          await apiDeleteProject(id);
          
          // Luego, actualizar el estado local
          set((state) => ({
            projects: state.projects.filter(project => project.id !== id),
            // Si el proyecto eliminado es el proyecto actual, lo reseteamos
            currentProject: state.currentProject?.id === id ? null : state.currentProject
          }));
          
          return true;
        } catch (error) {
          console.error('Error al eliminar el proyecto:', error);
          return false;
        }
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
      
      clearCurrentProject: () => {
        set({ currentProject: null });
      },
      
      addProjectMembers: async (projectId, memberIds) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === projectId);
          
          if (projectIndex === -1) return null;
          
          console.log('Agregando miembros al proyecto:', projectId, memberIds);
          
          try {
            // Intento 1: Agregar miembros al proyecto en el servidor
            const updatedProjectFromServer = await apiAddProjectMembers(projectId, memberIds);
            
            if (updatedProjectFromServer) {
              console.log('Miembros agregados al proyecto en el servidor:', updatedProjectFromServer);
              
              // Actualizar el estado local con los datos del servidor
              const updatedProjects = [...projects];
              updatedProjects[projectIndex] = updatedProjectFromServer;
              
              set({
                projects: updatedProjects,
                currentProject: get().currentProject?.id === projectId ? updatedProjectFromServer : get().currentProject
              });
              
              return updatedProjectFromServer;
            }
          } catch (apiError) {
            console.error('Error al agregar miembros mediante API:', apiError);
          }
          
          // Modo offline: Actualizar localmente si la API falló
          console.log('Actualizando miembros localmente (modo offline)');
          
          // Obtener el proyecto actual
          const currentProject = {...projects[projectIndex]};
          
          // Añadir los miembros (evitando duplicados)
          const currentMembers = Array.isArray(currentProject.members) ? currentProject.members : [];
          const uniqueMembers = new Set([...currentMembers]);
          memberIds.forEach(id => uniqueMembers.add(id));
          
          const updatedProject = {
            ...currentProject,
            members: Array.from(uniqueMembers),
            updatedAt: new Date()
          };
          
          // Actualizar el estado
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProject;
          
          set({
            projects: updatedProjects,
            currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
          });
          
          return updatedProject;
        } catch (error) {
          console.error('Error al agregar miembros al proyecto:', error);
          return null;
        }
      },
      
      removeProjectMembers: async (projectId, memberIds) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === projectId);
          
          if (projectIndex === -1) return null;
          
          console.log('Eliminando miembros del proyecto:', projectId, memberIds);
          
          try {
            // Intento 1: Eliminar miembros del proyecto en el servidor
            const updatedProjectFromServer = await apiRemoveProjectMembers(projectId, memberIds);
            
            if (updatedProjectFromServer) {
              console.log('Miembros eliminados del proyecto en el servidor:', updatedProjectFromServer);
              
              // Actualizar el estado local con los datos del servidor
              const updatedProjects = [...projects];
              updatedProjects[projectIndex] = updatedProjectFromServer;
              
              set({
                projects: updatedProjects,
                currentProject: get().currentProject?.id === projectId ? updatedProjectFromServer : get().currentProject
              });
              
              return updatedProjectFromServer;
            }
          } catch (apiError) {
            console.error('Error al eliminar miembros mediante API:', apiError);
          }
          
          // Modo offline: Actualizar localmente si la API falló
          console.log('Eliminando miembros localmente (modo offline)');
          
          // Obtener el proyecto actual
          const currentProject = {...projects[projectIndex]};
          
          // Filtrar los miembros a eliminar
          const currentMembers = Array.isArray(currentProject.members) ? currentProject.members : [];
          const filteredMembers = currentMembers.filter(id => !memberIds.includes(id));
          
          const updatedProject = {
            ...currentProject,
            members: filteredMembers,
            updatedAt: new Date()
          };
          
          // Actualizar el estado
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProject;
          
          set({
            projects: updatedProjects,
            currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
          });
          
          return updatedProject;
        } catch (error) {
          console.error('Error al eliminar miembros del proyecto:', error);
          return null;
        }
      },
      
      addTask: (projectId, task) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === projectId);
          
          if (projectIndex === -1) {
            console.error(`Proyecto no encontrado: ${projectId}`);
            return;
          }
          
          console.log(`Agregando tarea al proyecto ${projectId}:`, task);
          
          const now = new Date();
          const newTask: Task = {
            ...task,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now
          };
          
          // Aseguramos que tasks exista antes de trabajar con él
          const currentTasks = Array.isArray(projects[projectIndex].tasks) 
            ? projects[projectIndex].tasks 
            : [];
          
          const updatedProject = {
            ...projects[projectIndex],
            tasks: [...currentTasks, newTask],
            updatedAt: now
          };
          
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProject;
          
          set({ 
            projects: updatedProjects,
            currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
          });
          
          console.log(`Tarea agregada exitosamente con ID: ${newTask.id}`);
          
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
        } catch (error) {
          console.error('Error al agregar tarea:', error);
        }
      },
      
      updateTask: (projectId, taskId, taskData) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === projectId);
          
          if (projectIndex === -1) {
            console.error(`Proyecto no encontrado: ${projectId}`);
            return;
          }
          
          console.log(`Actualizando tarea ${taskId} del proyecto ${projectId}:`, taskData);
          
          // Aseguramos que tasks exista antes de trabajar con él
          const currentTasks = Array.isArray(projects[projectIndex].tasks) 
            ? projects[projectIndex].tasks 
            : [];
          
          const taskIndex = currentTasks.findIndex(task => task.id === taskId);
          
          if (taskIndex === -1) {
            console.error(`Tarea no encontrada: ${taskId}`);
            return;
          }
          
          const updatedTask = {
            ...currentTasks[taskIndex],
            ...taskData,
            updatedAt: new Date()
          };
          
          const updatedTasks = [...currentTasks];
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
          
          console.log(`Tarea ${taskId} actualizada exitosamente`);
          return updatedTask;
        } catch (error) {
          console.error('Error al actualizar tarea:', error);
        }
      },
      
      deleteTask: (projectId, taskId) => {
        try {
          const { projects } = get();
          const projectIndex = projects.findIndex(project => project.id === projectId);
          
          if (projectIndex === -1) {
            console.error(`Proyecto no encontrado: ${projectId}`);
            return;
          }
          
          console.log(`Eliminando tarea ${taskId} del proyecto ${projectId}`);
          
          // Aseguramos que tasks exista antes de trabajar con él
          const currentTasks = Array.isArray(projects[projectIndex].tasks) 
            ? projects[projectIndex].tasks 
            : [];
          
          const updatedProject = {
            ...projects[projectIndex],
            tasks: currentTasks.filter(task => task.id !== taskId),
            updatedAt: new Date()
          };
          
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProject;
          
          set({ 
            projects: updatedProjects,
            currentProject: get().currentProject?.id === projectId ? updatedProject : get().currentProject
          });
          
          console.log(`Tarea ${taskId} eliminada exitosamente`);
          return true;
        } catch (error) {
          console.error('Error al eliminar tarea:', error);
          return false;
        }
      },
      
      addComment: (projectId, comment) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return;
        
        const newComment: Comment = {
          ...comment,
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
      addAttachment: (projectId, attachment) => {
        const { projects } = get();
        const projectIndex = projects.findIndex(project => project.id === projectId);
        
        if (projectIndex === -1) return;
        
        const newAttachment: Attachment = {
          ...attachment,
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
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject 
      }),
      // Agregar sincronización para garantizar persistencia
      onRehydrateStorage: () => (state) => {
        console.log('Store rehydrated with', state?.projects?.length || 0, 'projects');
        // Intentar forzar una sincronización después de rehidratar
        setTimeout(() => {
          syncProjectStore();
          console.log('Forzando sincronización post-rehidratación');
        }, 500);
      },
      // Usar el storage mejorado
      storage: enhancedStorage
    }
  )
); 