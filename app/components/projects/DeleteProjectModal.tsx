import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteProjectModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { deleteProject } = useProjectStore();
  const { currentUser, login } = useUserStore();
  
  if (!isOpen) return null;
  
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!currentUser) {
        setError('No hay usuario autenticado');
        setIsLoading(false);
        return;
      }
      
      // Verificar la contraseña del usuario actual
      const user = await login(currentUser.email, password);
      
      if (!user) {
        setError('Contraseña incorrecta');
        setIsLoading(false);
        return;
      }
      
      // Si la contraseña es correcta, eliminar el proyecto
      console.log(`Intentando eliminar el proyecto: ${projectId}`);
      const success = await deleteProject(projectId);
      
      if (success) {
        console.log('Proyecto eliminado correctamente');
        setIsLoading(false);
        onClose();
        router.push('/projects');
      } else {
        console.error('Error al eliminar el proyecto');
        setError('No se pudo eliminar el proyecto. Verifica que tengas permisos para hacerlo.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error al eliminar el proyecto:', error);
      setError('Error al eliminar el proyecto');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-red-600 flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            Eliminar proyecto
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Estás a punto de eliminar el proyecto <span className="font-semibold">{projectName}</span>.
            </p>
            <p className="text-gray-700 mb-4">
              Esta acción no se puede deshacer y eliminará todas las tareas, comentarios y archivos asociados.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-700">
                Por seguridad, debes confirmar tu contraseña para continuar.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleDelete}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Tu contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isLoading ? 'Eliminando...' : 'Eliminar proyecto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal; 