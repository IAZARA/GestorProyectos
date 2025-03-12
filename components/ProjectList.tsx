'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, ArrowUpRight } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { Project } from '../types/project';

export default function ProjectList() {
  const searchParams = useSearchParams();
  const { projects } = useProjectStore();
  const { currentUser } = useUserStore();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Filtrar proyectos según el rol del usuario
      let userProjects = projects;
      if (currentUser.role !== 'Administrador') {
        userProjects = projects.filter(project => 
          project.createdBy === currentUser.id || 
          project.members.includes(currentUser.id)
        );
      }

      // Aplicar filtros de búsqueda
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');

      let filtered = userProjects;
      if (status) {
        filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
      }
      if (priority) {
        filtered = filtered.filter(p => p.priority.toLowerCase() === priority.toLowerCase());
      }

      setFilteredProjects(filtered);
    } catch (error) {
      console.error('Error al filtrar proyectos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, projects, currentUser]);

  if (loading) {
    return <div>Cargando proyectos...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">{project.name}</h3>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{project.members.length}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              project.status === 'Completado' ? 'bg-green-100 text-green-800' :
              project.status === 'En_Progreso' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              project.priority === 'Alta' ? 'bg-red-100 text-red-800' :
              project.priority === 'Media' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.priority}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
} 