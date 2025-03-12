'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import KanbanBoard from '../../components/projects/KanbanBoard';
import AttachmentsList from '../../components/projects/AttachmentsList';
import CollaborativeWiki from '../../components/projects/CollaborativeWiki';
import { Calendar, Users, FileText, Kanban, Book, ArrowLeft, UserPlus, X, Search, Check, UserMinus, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import DeleteProjectModal from '../../components/projects/DeleteProjectModal';

type TabType = 'overview' | 'kanban' | 'wiki' | 'files';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const projectId = params.id as string;
  const { getProjectById, updateProject } = useProjectStore();
  const { users, currentUser, getUserById } = useUserStore();
  
  const project = getProjectById(projectId);
  
  // Verificar si el usuario actual es administrador, gestor o creador del proyecto
  const canManageMembers = 
    currentUser?.role === 'Administrador' || 
    currentUser?.role === 'Gestor' || 
    (project && project.createdBy === currentUser?.id);
  
  // Verificar si el usuario actual puede eliminar el proyecto
  const canDeleteProject = 
    currentUser?.role === 'Administrador' || 
    (project && project.createdBy === currentUser?.id);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    // Inicializar los usuarios seleccionados con los miembros actuales del proyecto
    if (project) {
      setSelectedUsers(project.members);
    }
  }, [status, router, project]);
  
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }
  
  if (!project) {
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
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const calculateDaysRemaining = () => {
    if (!project.endDate) return 'Sin fecha límite';
    
    const today = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoy';
    return `${diffDays} días restantes`;
  };
  
  const calculateProgress = () => {
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'Completado').length;
    return Math.round((completedTasks / totalTasks) * 100);
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
  
  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSaveMembers = () => {
    if (project) {
      updateProject(project.id, { members: selectedUsers });
      setShowMemberModal(false);
    }
  };
  
  const filteredUsers = users.filter(user => 
    (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    user.id !== project.createdBy // No mostrar al creador del proyecto en la lista
  );
  
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
                  <p className="font-medium">{formatDate(project.startDate)}</p>
                </div>
                {project.endDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha de finalización</p>
                    <p className="font-medium">{formatDate(project.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Creado por</p>
                  <p className="font-medium">
                    {getUserById(project.createdBy)?.firstName} {getUserById(project.createdBy)?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
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
              <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Miembros del proyecto</h3>
                {canManageMembers && (
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <UserPlus size={18} className="mr-1" />
                    <span>Gestionar miembros</span>
                  </button>
                )}
              </div>
              
              {project.members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.members.map(memberId => {
                    const member = getUserById(memberId);
                    if (!member) return null;
                    
                    return (
                      <div key={memberId} className="flex items-center p-3 border rounded-lg">
                        {member.photoUrl ? (
                          <img 
                            src={member.photoUrl} 
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500 font-medium">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-grow">
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-gray-500">{member.expertise}</p>
                        </div>
                        {canManageMembers && memberId !== project.createdBy && (
                          <button
                            onClick={() => {
                              const updatedMembers = project.members.filter(id => id !== memberId);
                              updateProject(project.id, { members: updatedMembers });
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar miembro"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
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
              <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-500 mt-1">Creado el {formatDate(project.createdAt)}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              
              {canDeleteProject && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="ml-4 flex items-center text-red-600 hover:text-red-800 px-3 py-1 rounded-md border border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-1" />
                  <span>Eliminar</span>
                </button>
              )}
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
                Información general
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
                Tablero Kanban
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
            </div>
          </div>
          
          <div className="mb-6">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Modal para gestionar miembros */}
        {showMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Gestionar miembros del proyecto</h3>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar usuarios por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Usuarios seleccionados ({selectedUsers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = getUserById(userId);
                    if (!user) return null;
                    
                    return (
                      <div 
                        key={userId}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                      >
                        <span>{user.firstName} {user.lastName}</span>
                        {userId !== project.createdBy && (
                          <button
                            onClick={() => handleToggleUser(userId)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Usuarios disponibles</h4>
                <div className="max-h-60 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredUsers.map(user => (
                        <div 
                          key={user.id}
                          className={`flex items-center p-2 rounded-md cursor-pointer ${
                            selectedUsers.includes(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleToggleUser(user.id)}
                        >
                          {user.photoUrl ? (
                            <img 
                              src={user.photoUrl} 
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <span className="text-gray-500 font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-grow">
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email} • {user.expertise}</p>
                          </div>
                          <div className="ml-2">
                            {selectedUsers.includes(user.id) ? (
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No se encontraron usuarios</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMembers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal para eliminar proyecto */}
        <DeleteProjectModal
          projectId={project.id}
          projectName={project.name}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
} 