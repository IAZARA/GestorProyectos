'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Search, Filter, Calendar, Clock, CheckSquare, User, Tag } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useUserStore } from '../../store/userStore';

export default function TasksPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Simulamos la carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Tareas</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm sm:text-base"
            >
              <ChevronLeft size={16} className="mr-1" />
              Volver al dashboard
            </button>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar tareas..."
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border rounded-md flex items-center text-gray-700 hover:bg-gray-50">
                <Filter size={16} className="mr-2" />
                Filtrar
              </button>
              <button className="px-4 py-2 bg-[#2d2c55] text-white rounded-md flex items-center hover:bg-opacity-90">
                <Plus size={16} className="mr-2" />
                Nueva Tarea
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2c55]"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <h3 className="text-xl font-medium text-gray-700 mb-2">Módulo en desarrollo</h3>
                <p className="text-gray-500 mb-4">
                  Estamos trabajando en esta funcionalidad. Pronto estará disponible.
                </p>
                <div className="flex justify-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Calendar size={24} className="text-blue-500 mb-2" />
                      <span className="text-sm">Planificación</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Clock size={24} className="text-green-500 mb-2" />
                      <span className="text-sm">Seguimiento</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <CheckSquare size={24} className="text-purple-500 mb-2" />
                      <span className="text-sm">Asignaciones</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <User size={24} className="text-orange-500 mb-2" />
                      <span className="text-sm">Colaboración</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
