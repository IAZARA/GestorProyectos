'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore, syncProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { ArrowLeft, Users, FileText, Kanban, Book } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { User } from '../../../types/user';

// Importar componentes reales
import KanbanBoard from '../../components/projects/KanbanBoard';
import CollaborativeWiki from '../../components/projects/CollaborativeWiki';
import AttachmentsList from '../../components/projects/AttachmentsList';
import MemberManagement from '../../components/projects/MemberManagement';

// Componente de gestión de miembros simplificado
const MembersList = ({ project, projectMembers, projectCreator, users, getUserById }: { 
  project: any, 
  projectMembers: Record<string, User>,
  projectCreator: User | null,
  users: User[],
  getUserById: (id: string) => Promise<User | undefined>
}) => {
  // Mostrar información del creador si está disponible
  const creatorId = typeof project.createdBy === 'object' 
    ? project.createdBy.id 
    : project.createdBy;

  // Preparar y mostrar las iniciales del usuario
  const getInitials = (user: User | null | undefined) => {
    if (!user || !user.firstName || !user.lastName) return '??';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  // Preparar y mostrar el nombre completo del usuario
  const getFullName = (user: User | null | undefined) => {
    if (!user) return 'Usuario Desconocido';
    if (!user.firstName && !user.lastName) return `Usuario ${user.id?.substring(0, 4) || ''}`;
    return `${user.firstName || ''} ${user.lastName || ''}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-medium mb-4">Gestión de Miembros</h2>
      
      {/* Mostrar creador del proyecto */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Creador del Proyecto</h3>
        <div className="flex items-center p-3 border rounded-lg mb-6 bg-blue-50">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
            <span className="text-blue-700 font-medium">
              {getInitials(projectCreator)}
            </span>
          </div>
          <div className="flex-grow">
            <p className="font-medium">{getFullName(projectCreator)}</p>
            {projectCreator?.email && (
              <p className="text-sm text-blue-700">{projectCreator.email}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Miembros Actuales ({project.members.length})</h3>
        
        {project.members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members.slice(0, 9).map((memberId: string) => {
              // Si el miembro es un objeto, obtener el ID
              const id = typeof memberId === 'object' ? memberId.id : memberId;
              if (!id) return null;
              
              // Intentar obtener el miembro de varias fuentes
              const member = projectMembers[id] || 
                            users.find(u => u.id === id) || 
                            (creatorId === id ? projectCreator : null);
              
              return (
                <div key={id} className="flex items-center p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-gray-500 font-medium">
                      {getInitials(member)}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{getFullName(member)}</p>
                    {member?.email && (
                      <p className="text-sm text-gray-500">{member.email}</p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {project.members.length > 9 && (
              <div className="flex items-center p-3 border rounded-lg">
                <p className="text-gray-500">y {project.members.length - 9} más...</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No hay miembros asignados a este proyecto.</p>
        )}
      </div>
      
      <p className="text-blue-600">La gestión completa de miembros estará disponible pronto.</p>
    </div>
  );
};

type TabType = 'overview' | 'kanban' | 'wiki' | 'files' | 'members';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getProjectById, currentProject, setCurrentProject } = useProjectStore();
  const { users, getUserById, currentUser, checkAuthState } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [projectCreator, setProjectCreator] = useState<User | null>(null);
  const [projectMembers, setProjectMembers] = useState<Record<string, User>>({});

  // Obtener el ID del proyecto de los parámetros
  const projectId = params?.id as string;
  
  // Verificar la autenticación y cargar el proyecto
  useEffect(() => {
    const loadProject = async () => {
      console.log("Cargando proyecto y datos de usuarios...");
      
      // Forzar sincronización del store de proyectos para asegurar datos actualizados
      syncProjectStore();
      
      if (!currentUser) {
        try {
          await checkAuthState();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          router.push('/login');
          return;
        }
        
        if (!currentUser) {
          router.push('/login');
          return;
        }
      }
      
      try {
        // Cargar todos los usuarios primero para asegurar disponibilidad
        if (!users || users.length === 0) {
          // Cargar usuarios directamente desde la función expuesta en el store
          console.log("No hay usuarios cargados, intentando cargar desde el servidor...");
          await useUserStore.getState().fetchUsers();
          console.log("Usuarios cargados del servidor:", useUserStore.getState().users.length);
        }
        
        // Cargar el proyecto
        const project = getProjectById(projectId);
        
        if (project) {
          console.log("Proyecto encontrado:", project.name);
          setCurrentProject(projectId);
          
          // Determinar creatorId
          let creatorId;
          if (typeof project.createdBy === 'object' && project.createdBy !== null) {
            creatorId = project.createdBy.id;
          } else {
            creatorId = project.createdBy;
          }
          
          console.log("ID del creador:", creatorId);
          
          // Asegurar que creatorId sea un string válido
          if (!creatorId) {
            console.error("Error: creatorId es null o undefined");
            creatorId = "unknown";
          }
          
          // Primero buscar el creador en la lista actualizada de usuarios
          const updatedUserList = useUserStore.getState().users;
          const creatorFromUpdatedList = updatedUserList.find(u => u.id === creatorId);
          
          if (creatorFromUpdatedList) {
            console.log("Creador encontrado en la lista actualizada:", creatorFromUpdatedList.firstName);
            setProjectCreator(creatorFromUpdatedList);
          } else {
            // Si no está en la lista actualizada, intentar obtenerlo directamente
            try {
              console.log("Buscando creador directamente por ID:", creatorId);
              const creator = await getUserById(creatorId);
              if (creator) {
                console.log("Creador cargado directamente:", creator.firstName);
                setProjectCreator(creator);
              } else {
                console.log("No se encontró información del creador en la API");
                // En caso de no encontrar el creador, crear un objeto con datos mínimos
                setProjectCreator({
                  id: creatorId,
                  firstName: "Usuario",
                  lastName: "Desconocido",
                  email: "desconocido@example.com",
                  role: 'Usuario'
                } as User);
              }
            } catch (e) {
              console.error("Error al cargar el creador:", e);
              // En caso de error, crear un objeto con datos mínimos
              setProjectCreator({
                id: creatorId,
                firstName: "Usuario",
                lastName: "Desconocido",
                email: "desconocido@example.com",
                role: 'Usuario'
              } as User);
            }
          }
          
          // Normalizar miembros (convertir objetos a IDs)
          const normalizedMembers = project.members.map(member => {
            return typeof member === 'object' && member !== null ? member.id : member;
          }).filter(Boolean);
          
          // Eliminar duplicados
          const uniqueMembers = [...new Set(normalizedMembers)];
          project.members = uniqueMembers;
          
          console.log("Miembros del proyecto (normalizados):", uniqueMembers);
          
          // Cargar información de miembros desde múltiples fuentes
          const memberData: Record<string, User> = {};
          const allUsers = useUserStore.getState().users;
          
          console.log("Buscando información de miembros. Usuarios disponibles:", allUsers.length);
          
          // Agregar el creador a los datos de miembros si ya lo tenemos
          if (creatorFromUpdatedList) {
            memberData[creatorId] = creatorFromUpdatedList;
          } else if (projectCreator) {
            memberData[creatorId] = projectCreator;
          }
          
          // Procesar cada miembro
          for (const memberId of uniqueMembers) {
            // Si ya tenemos este miembro (por ejemplo, si es el creador), continuar
            if (memberData[memberId]) continue;
            
            // Buscar en la lista completa de usuarios
            const memberFromList = allUsers.find(u => u.id === memberId);
            
            if (memberFromList) {
              console.log(`Miembro ${memberId} encontrado en la lista:`, memberFromList.firstName);
              memberData[memberId] = memberFromList;
            } else {
              // Si no está en la lista, intentar obtenerlo directamente
              try {
                console.log(`Buscando miembro ${memberId} directamente...`);
                const member = await getUserById(memberId);
                if (member) {
                  console.log(`Miembro ${memberId} cargado directamente:`, member.firstName);
                  memberData[memberId] = member;
                } else {
                  console.log(`No se encontró información para el miembro ${memberId}`);
                  // Crear un usuario mínimo para evitar "Cargando..."
                  memberData[memberId] = {
                    id: memberId,
                    firstName: "Usuario",
                    lastName: memberId.substring(0, 4),
                    email: `usuario-${memberId.substring(0, 4)}@example.com`,
                    role: 'Usuario'
                  } as User;
                }
              } catch (e) {
                console.error(`Error al cargar miembro ${memberId}:`, e);
                // Crear un usuario mínimo para evitar "Cargando..."
                memberData[memberId] = {
                  id: memberId,
                  firstName: "Usuario",
                  lastName: memberId.substring(0, 4),
                  email: `usuario-${memberId.substring(0, 4)}@example.com`,
                  role: 'Usuario'
                } as User;
              }
            }
          }
          
          console.log(`Información cargada para ${Object.keys(memberData).length} miembros`);
          setProjectMembers(memberData);
          setIsLoading(false);
        } else {
          console.error("Proyecto no encontrado:", projectId);
          router.push('/projects');
        }
      } catch (error) {
        console.error("Error al cargar el proyecto:", error);
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId, currentUser, router, getProjectById, setCurrentProject, checkAuthState, getUserById, users]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Cargando...</p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col">
        <p className="text-lg mb-4">Proyecto no encontrado</p>
        <button 
          onClick={() => router.push('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Volver a proyectos
        </button>
      </div>
    );
  }
  
  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const calculateDaysRemaining = () => {
    if (!currentProject.endDate) return 'Sin fecha límite';
    
    const today = new Date();
    const endDate = new Date(currentProject.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoy';
    return `${diffDays} días restantes`;
  };
  
  const calculateProgress = () => {
    // Verificar que tasks sea un array
    if (!currentProject.tasks || !Array.isArray(currentProject.tasks) || currentProject.tasks.length === 0) {
      return 0;
    }
    
    // Contar tareas completadas, asegurando que estamos trabajando con una propiedad status válida
    const completedTasks = currentProject.tasks.filter((task: any) => 
      task && (task.status === 'Completado' || task.status === 'completado')
    ).length;
    
    // Calcular porcentaje
    const percentage = Math.round((completedTasks / currentProject.tasks.length) * 100);
    console.log(`Progreso del proyecto: ${completedTasks}/${currentProject.tasks.length} tareas completadas (${percentage}%)`);
    
    return percentage;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En_Progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-4">Información general</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de inicio</p>
                  <p className="font-medium">{formatDate(currentProject.startDate)}</p>
                </div>
                {currentProject.endDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha de finalización</p>
                    <p className="font-medium">{formatDate(currentProject.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Creado por</p>
                  <p className="font-medium">
                    {projectCreator ? `${projectCreator.firstName} ${projectCreator.lastName}` : 'Cargando...'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProject.status)}`}>
                    {currentProject.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-1">Progreso</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{calculateProgress()}%</span>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-1">Tiempo restante</p>
                <p className="font-medium">{calculateDaysRemaining()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-4">Descripción</h3>
              <p className="text-gray-700 whitespace-pre-line">{currentProject.description}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Miembros del proyecto</h3>
                <button
                  onClick={() => setActiveTab('members')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Ver todos
                </button>
              </div>
              
              {currentProject.members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProject.members.slice(0, 6).map((memberId: string) => {
                    const id = typeof memberId === 'object' ? memberId.id : memberId;
                    if (!id) return null;
                    
                    // Intentar obtener el miembro de varias fuentes
                    const creatorId = typeof currentProject.createdBy === 'object' 
                      ? currentProject.createdBy.id 
                      : currentProject.createdBy;
                      
                    const member = projectMembers[id] || 
                                  users.find(u => u.id === id) || 
                                  (creatorId === id ? projectCreator : null);
                    
                    // Preparar y mostrar las iniciales del usuario
                    const getInitials = (user: User | null | undefined) => {
                      if (!user || !user.firstName || !user.lastName) return '??';
                      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
                    };
                    
                    // Preparar y mostrar el nombre completo del usuario
                    const getFullName = (user: User | null | undefined) => {
                      if (!user) return 'Usuario Desconocido';
                      if (!user.firstName && !user.lastName) return `Usuario ${user.id?.substring(0, 4) || ''}`;
                      return `${user.firstName || ''} ${user.lastName || ''}`;
                    };
                    
                    return (
                      <div key={id} className="flex items-center p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-medium">
                            {getInitials(member)}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">{getFullName(member)}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {currentProject.members.length > 6 && (
                    <div className="flex items-center justify-center p-3 border rounded-lg">
                      <p className="text-blue-600">+{currentProject.members.length - 6} más</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No hay miembros asignados a este proyecto.</p>
              )}
            </div>
          </div>
        );
      case 'kanban':
        return <KanbanBoard projectId={projectId} />;
      case 'wiki':
        return <CollaborativeWiki projectId={projectId} />;
      case 'files':
        return <AttachmentsList projectId={projectId} />;
      case 'members':
        return <MemberManagement 
          projectId={projectId}
          currentUser={currentUser}
          projectMembers={projectMembers}
          users={users || []}
          currentProject={currentProject}
        />;
      default:
        return null;
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Volver a proyectos</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{currentProject.name}</h1>
              <p className="text-gray-500 mt-1">Creado el {formatDate(currentProject.createdAt)}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentProject.status)}`}>
                {currentProject.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === 'overview' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={18} className="mr-2" />
                Información
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === 'kanban' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Kanban size={18} className="mr-2" />
                Kanban
              </button>
              <button
                onClick={() => setActiveTab('wiki')}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === 'wiki' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Book size={18} className="mr-2" />
                Wiki
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === 'files' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={18} className="mr-2" />
                Archivos
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-3 flex items-center whitespace-nowrap ${
                  activeTab === 'members' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users size={18} className="mr-2" />
                Miembros
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}