'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '../../store/projectStore';
import { useUserStore } from '../../store/userStore';
import { Project } from '../../types/project';
import { Calendar as CalendarIcon, Users, Clock, ArrowUpRight, BarChart3, FileText, Briefcase, Plus, Lock, AlertCircle } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();
  const { projects } = useProjectStore();
  const { users, currentUser, getUserById } = useUserStore();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>('');

  // Determinar el saludo según la hora del día
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Buenos días');
    } else if (hour >= 12 && hour < 20) {
      setGreeting('Buenas tardes');
    } else {
      setGreeting('Buenas noches');
    }
  }, []);

  // Cargar proyectos
  useEffect(() => {
    if (currentUser) {
      // Proyectos donde el usuario es miembro o creador
      const filteredProjects = projects.filter(project => 
        project.members.includes(currentUser.id) || project.createdBy === currentUser.id
      );
      
      setUserProjects(filteredProjects);
      
      // Todos los proyectos (para mostrar en el dashboard)
      setAllProjects(projects);
      
      // Contar tareas pendientes asignadas al usuario
      const tasks = filteredProjects.flatMap(project => project.tasks);
      const userPendingTasks = tasks.filter(task => 
        task.assignedTo === currentUser.id && task.status !== 'Completado'
      );
      
      setPendingTasks(userPendingTasks.length);
    }
  }, [currentUser, projects]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (project: Project) => {
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'Completado').length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const handleProjectClick = (projectId: string) => {
    // Verificar si el usuario tiene acceso al proyecto
    const hasAccess = userProjects.some(p => p.id === projectId);
    
    if (hasAccess || currentUser?.role === 'Administrador') {
      router.push(`/projects/${projectId}`);
    } else {
      setSelectedProjectId(projectId);
      setShowAccessDeniedModal(true);
    }
  };

  const isUserMemberOfProject = (projectId: string) => {
    return userProjects.some(p => p.id === projectId);
  };

  // Contenido del dashboard
  const DashboardContent = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting}</h1>
            <p className="text-gray-500 mt-1">{currentUser?.firstName} {currentUser?.lastName}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/administracion')}
              className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              <Users size={18} className="mr-2" />
              Administración
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <CalendarIcon size={18} className="mr-2" />
              Calendario
            </button>
          </div>
        </div>
        
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proyectos asignados</p>
                <p className="text-2xl font-semibold">{userProjects.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tareas pendientes</p>
                <p className="text-2xl font-semibold">{pendingTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rol en el sistema</p>
                <p className="text-2xl font-semibold">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Proyectos asignados */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mis proyectos</h2>
              <button 
                onClick={() => router.push('/projects')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                Ver todos
                <ArrowUpRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
          
          {userProjects.length > 0 ? (
            <div className="divide-y">
              {userProjects.slice(0, 3).map(project => (
                <div 
                  key={project.id} 
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'En_Progreso' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-1">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon size={14} className="mr-1" />
                      <span>Creado: {formatDate(project.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span>{project.members.length} miembros</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>Progreso: {calculateProgress(project)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No tienes proyectos asignados</p>
              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Gestor') && (
                <button
                  onClick={() => router.push('/projects?create=true')}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Crear un nuevo proyecto
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Todos los proyectos (visible para todos los usuarios) */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Todos los proyectos</h2>
              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Gestor') && (
                <button 
                  onClick={() => router.push('/projects/new')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-1" />
                  Nuevo proyecto
                </button>
              )}
            </div>
          </div>
          
          {allProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miembros
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allProjects.map(project => (
                    <tr 
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">{formatDate(project.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'En_Progreso' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${calculateProgress(project)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{calculateProgress(project)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.members.length} miembros
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isUserMemberOfProject(project.id) || currentUser?.role === 'Administrador' ? (
                          <span className="text-green-600 flex items-center">
                            <span className="h-2 w-2 bg-green-600 rounded-full mr-1"></span>
                            Acceso
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center">
                            <Lock size={14} className="mr-1" />
                            Restringido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No hay proyectos en el sistema</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de acceso denegado */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle size={24} className="mr-2" />
              <h3 className="text-lg font-medium">Acceso denegado</h3>
            </div>
            <p className="mb-4">No tienes acceso a este proyecto. Contacta con un administrador o gestor para solicitar acceso.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
} 