'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '../../store/projectStore';
import { useUserStore } from '../../store/userStore';
import { Project, ProjectStatus } from '../../types/project';
import { Plus, Calendar, Users, Search, Filter, ArrowUpRight } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import dynamic from 'next/dynamic';

const ProjectList = dynamic(() => import('../../components/ProjectList'), {
  ssr: false,
  loading: () => <div>Cargando proyectos...</div>
});

const ProjectFilters = dynamic(() => import('../../components/ProjectFilters'), {
  ssr: false,
  loading: () => <div>Cargando filtros...</div>
});

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'Pendiente' as ProjectStatus,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    members: [] as string[]
  });
  
  const { projects, addProject } = useProjectStore();
  const { users, currentUser } = useUserStore();
  
  // Verificar si se debe mostrar el modal de creación basado en el parámetro de URL
  useEffect(() => {
    const shouldShowCreateModal = searchParams.get('create') === 'true';
    if (shouldShowCreateModal && (currentUser?.role === 'Administrador' || currentUser?.role === 'Gestor')) {
      setShowCreateModal(true);
      
      // Limpiar el parámetro de la URL sin recargar la página
      const url = new URL(window.location.href);
      url.searchParams.delete('create');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams, currentUser]);
  
  // Contenido principal de la página
  const ProjectsContent = () => {
    if (!currentUser) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">Cargando...</p>
        </div>
      );
    }
    
    const isAdmin = currentUser.role === 'Administrador';
    const isManager = currentUser.role === 'Gestor';
    
    // Filtrar proyectos según el rol del usuario
    const filteredProjects = projects.filter(project => {
      // Administradores ven todos los proyectos
      if (isAdmin) return true;
      
      // Gestores ven los proyectos que han creado o donde son miembros
      if (isManager) {
        return project.createdBy === currentUser.id || project.members.includes(currentUser.id);
      }
      
      // Usuarios normales solo ven los proyectos donde son miembros
      return project.members.includes(currentUser.id);
    });
    
    // Aplicar filtros de búsqueda y estado
    const displayedProjects = filteredProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    const handleCreateProject = () => {
      if (!newProject.name.trim()) return;
      
      const projectData = {
        ...newProject,
        startDate: new Date(newProject.startDate),
        endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
        createdBy: currentUser.id,
        members: [...newProject.members, currentUser.id] // Añadir al creador como miembro
      };
      
      const createdProject = addProject(projectData);
      setShowCreateModal(false);
      
      // Resetear el formulario
      setNewProject({
        name: '',
        description: '',
        status: 'Pendiente',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        members: []
      });
      
      // Redirigir al detalle del proyecto creado
      router.push(`/projects/${createdProject.id}`);
    };
    
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    const getStatusColor = (status: ProjectStatus) => {
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
    
    const calculateProgress = (project: Project) => {
      const totalTasks = project.tasks.length;
      if (totalTasks === 0) return 0;
      
      const completedTasks = project.tasks.filter(task => task.status === 'Completado').length;
      return Math.round((completedTasks / totalTasks) * 100);
    };
    
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Proyectos</h1>
            
            {(isAdmin || isManager) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <Plus size={16} className="mr-2" />
                Crear proyecto
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar proyectos..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="w-full md:w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En_Progreso">En progreso</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {displayedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProjects.map(project => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar size={16} className="mr-1" />
                      <span>Inicio: {formatDate(project.startDate)}</span>
                    </div>
                    
                    {project.endDate && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar size={16} className="mr-1" />
                        <span>Fin: {formatDate(project.endDate)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Users size={16} className="mr-1" />
                      <span>{project.members.length} miembros</span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progreso</span>
                        <span className="text-sm font-medium">{calculateProgress(project)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${calculateProgress(project)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-gray-50 flex justify-end">
                    <button className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                      Ver detalles
                      <ArrowUpRight size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No se encontraron proyectos</p>
              {(isAdmin || isManager) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <Plus size={16} className="mr-2" />
                  Crear tu primer proyecto
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Modal de creación de proyecto */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Crear nuevo proyecto</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del proyecto *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Nombre del proyecto"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Descripción del proyecto"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value as ProjectStatus})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En_Progreso">En progreso</option>
                      <option value="Completado">Completado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de finalización
                    </label>
                    <input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Miembros
                    </label>
                    <select
                      multiple
                      value={newProject.members}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setNewProject({...newProject, members: selectedOptions});
                      }}
                      className="w-full p-2 border rounded"
                      size={4}
                    >
                      {users
                        .filter(user => user.id !== currentUser.id) // Excluir al usuario actual
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))
                      }
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar múltiples miembros
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!newProject.name || !newProject.startDate}
                >
                  Crear proyecto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Proyectos</h1>
      <ProjectFilters />
      <ProjectList />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Cargando...</div>}>
        <ProjectsContent />
      </Suspense>
    </ProtectedRoute>
  );
} 