'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import KanbanBoard from '../../components/projects/KanbanBoard';
import AttachmentsList from '../../components/projects/AttachmentsList';
import CollaborativeWiki from '../../components/projects/CollaborativeWiki';
import { Calendar, Users, FileText, Kanban, Book, ArrowLeft } from 'lucide-react';

type TabType = 'overview' | 'kanban' | 'wiki' | 'files';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const projectId = params.id as string;
  const { getProjectById } = useProjectStore();
  const { getUserById } = useUserStore();
  
  const project = getProjectById(projectId);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
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
              <h3 className="text-xl font-medium mb-4">Miembros del proyecto</h3>
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
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
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
          <div className="mt-4 md:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
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
    </div>
  );
} 