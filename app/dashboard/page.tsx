'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useUserStore } from '../../store/userStore';
import { Project } from '../../types/project';
import { Calendar, Users, Clock, ArrowUpRight, BarChart3, FileText, Briefcase, Plus, Lock, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { projects } = useProjectStore();
  const { users, currentUser, getUserById } = useUserStore();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Inicializar el usuario actual desde la sesión si no existe
  useEffect(() => {
    const initializeUser = async () => {
      if (status === 'authenticated' && session?.user && !currentUser) {
        // Buscar el usuario por email
        const userFound = users.find(u => u.email === session.user.email);
        if (userFound) {
          console.log("Usuario encontrado en el store:", userFound.firstName);
          // Iniciar sesión manualmente en el store
          useUserStore.getState().login(userFound.email, "admin123"); // Usamos la contraseña de prueba
        }
      }
      
      if (status !== 'loading') {
        // Dar tiempo para que se cargue todo
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };
    
    initializeUser();
  }, [status, session, currentUser, users]);

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

  // Mostrar pantalla de carga
  if (isLoading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Cargando...</p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, mostrar mensaje de error
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4 text-red-600">Error al cargar el usuario</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

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
    
    if (hasAccess || currentUser.role === 'Administrador') {
      router.push(`/projects/${projectId}`);
    } else {
      setSelectedProjectId(projectId);
      setShowAccessDeniedModal(true);
    }
  };

  const isUserMemberOfProject = (projectId: string) => {
    return userProjects.some(p => p.id === projectId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bienvenido, {currentUser.firstName} {currentUser.lastName}</p>
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
                <p className="text-2xl font-semibold">{currentUser.role}</p>
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
                      <Calendar size={14} className="mr-1" />
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
              {(currentUser.role === 'Administrador' || currentUser.role === 'Gestor') && (
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
        
        {/* Todos los proyectos */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Todos los proyectos</h2>
          </div>
          
          {allProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {allProjects.map(project => (
                <div 
                  key={project.id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{project.name}</h3>
                      {!isUserMemberOfProject(project.id) && currentUser.role !== 'Administrador' && (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-1">{project.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'En_Progreso' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Users size={14} className="mr-1" />
                        <span>{project.members.length} miembros</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Creado: {formatDate(project.createdAt)}
                    </span>
                    
                    {isUserMemberOfProject(project.id) || currentUser.role === 'Administrador' ? (
                      <span className="text-blue-600 text-xs font-medium">Ver detalles</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Acceso restringido</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No hay proyectos disponibles</p>
            </div>
          )}
        </div>
        
        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Acciones rápidas</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/projects')}
                className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <Briefcase size={20} className="mr-2 text-blue-600" />
                <span>Ver todos los proyectos</span>
              </button>
              
              {(currentUser.role === 'Administrador' || currentUser.role === 'Gestor') && (
                <button 
                  onClick={() => router.push('/projects?create=true')}
                  className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <Plus size={20} className="mr-2 text-green-600" />
                  <span>Crear nuevo proyecto</span>
                </button>
              )}
              
              {currentUser.role === 'Administrador' && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <Users size={20} className="mr-2 text-purple-600" />
                  <span>Gestionar usuarios</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de acceso denegado */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-semibold">Acceso denegado</h2>
              </div>
              
              <p className="mb-4">
                No tienes acceso a este proyecto. Solo puedes ver los detalles de proyectos donde has sido asignado como miembro.
              </p>
              
              <p className="text-sm text-gray-500 mb-4">
                Contacta con un gestor o administrador si necesitas acceso a este proyecto.
              </p>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 