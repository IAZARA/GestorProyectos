'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, ArrowUpRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  teamMembers: string[];
}

export default function ProjectList() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí normalmente harías una llamada a la API
    // Por ahora usaremos datos de ejemplo
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Simular una llamada a la API
        const mockProjects: Project[] = [
          {
            id: '1',
            title: 'Proyecto Demo 1',
            description: 'Descripción del proyecto demo 1',
            status: 'pendiente',
            priority: 'alta',
            startDate: '2024-03-01',
            endDate: '2024-04-01',
            teamMembers: ['Usuario 1', 'Usuario 2']
          },
          // Añade más proyectos de ejemplo aquí
        ];

        // Aplicar filtros
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        let filteredProjects = mockProjects;
        if (status) {
          filteredProjects = filteredProjects.filter(p => p.status === status);
        }
        if (priority) {
          filteredProjects = filteredProjects.filter(p => p.priority === priority);
        }

        setProjects(filteredProjects);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [searchParams]);

  if (loading) {
    return <div>Cargando proyectos...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">{project.title}</h3>
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
              <span>{project.teamMembers.length}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              project.status === 'completado' ? 'bg-green-100 text-green-800' :
              project.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {project.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              project.priority === 'alta' ? 'bg-red-100 text-red-800' :
              project.priority === 'media' ? 'bg-orange-100 text-orange-800' :
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