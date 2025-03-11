'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Projects() {
  const router = useRouter();
  
  // Datos de ejemplo para proyectos
  const projects = [
    {
      id: '1',
      name: 'Proyecto Demo 1',
      description: 'Este es un proyecto de demostración',
      status: 'En Progreso',
      tasks: 5
    },
    {
      id: '2',
      name: 'Proyecto Demo 2',
      description: 'Otro proyecto de ejemplo para mostrar la interfaz',
      status: 'Pendiente',
      tasks: 3
    },
    {
      id: '3',
      name: 'Proyecto Demo 3',
      description: 'Un tercer proyecto para completar la demostración',
      status: 'Completado',
      tasks: 8
    }
  ];
  
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Volver al Dashboard
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lista de Proyectos</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Nuevo Proyecto
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>Estado: {project.status}</span>
                    <span>Tareas: {project.tasks}</span>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 