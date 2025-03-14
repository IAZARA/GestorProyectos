'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Upload, Calendar, Clock, Users, FileText } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useUserStore } from '../../store/userStore';

export default function PlanillaAsistenciaPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Simulamos la carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Función para descargar la plantilla
  const handleDownloadTemplate = () => {
    // En una implementación real, esto descargaría un archivo Excel
    alert('Descargando plantilla de asistencia...');
  };

  // Función para subir la plantilla completada
  const handleUploadTemplate = () => {
    // En una implementación real, esto abriría un selector de archivos
    alert('Esta funcionalidad estará disponible próximamente');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Planilla de Asistencia</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm sm:text-base"
            >
              <ChevronLeft size={16} className="mr-1" />
              Volver al dashboard
            </button>
          </div>

          {/* Filtros de mes y año */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="flex gap-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 sm:ml-auto sm:mt-auto">
              <button 
                onClick={handleDownloadTemplate}
                className="px-4 py-2 border rounded-md flex items-center text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} className="mr-2" />
                Descargar Plantilla
              </button>
              <button 
                onClick={handleUploadTemplate}
                className="px-4 py-2 bg-[#2d2c55] text-white rounded-md flex items-center hover:bg-opacity-90"
              >
                <Upload size={16} className="mr-2" />
                Subir Completada
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
                      <span className="text-sm">Control de Días</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Clock size={24} className="text-green-500 mb-2" />
                      <span className="text-sm">Registro Horario</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Users size={24} className="text-purple-500 mb-2" />
                      <span className="text-sm">Personal</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <FileText size={24} className="text-orange-500 mb-2" />
                      <span className="text-sm">Reportes</span>
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
