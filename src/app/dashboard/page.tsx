'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard de Usuario</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-lg mb-4">Bienvenido al sistema de gestión de proyectos.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Mis Proyectos</h2>
              <p className="text-gray-600 mb-4">Accede a los proyectos en los que estás participando.</p>
              <button 
                onClick={() => router.push('/projects')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ver Proyectos
              </button>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Mis Tareas</h2>
              <p className="text-gray-600 mb-4">Revisa las tareas que tienes asignadas.</p>
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Ver Tareas
              </button>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Mi Perfil</h2>
              <p className="text-gray-600 mb-4">Actualiza tu información personal.</p>
              <button 
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 