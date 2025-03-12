'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';
import { ProjectStatus, ProjectPriority } from '../types/project';

export default function ProjectFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Filter className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Filtros</h2>
      </div>
      <div className="flex flex-wrap gap-4">
        <select
          className="border rounded-lg px-3 py-2"
          value={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Estado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En_Progreso">En Progreso</option>
          <option value="Completado">Completado</option>
        </select>
        
        <select
          className="border rounded-lg px-3 py-2"
          value={searchParams.get('priority') || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">Prioridad</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </div>
    </div>
  );
} 