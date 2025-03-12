'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Filter } from 'lucide-react';

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
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completado</option>
        </select>
        
        <select
          className="border rounded-lg px-3 py-2"
          value={searchParams.get('priority') || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">Prioridad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
    </div>
  );
} 