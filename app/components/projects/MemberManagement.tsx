'use client';
import React, { useState, useEffect } from 'react';
import { User } from '../../../types/user';
import { useProjectStore } from '../../../store/projectStore';
import { UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MemberManagementProps {
  projectId: string;
  currentUser: User | null;
  projectMembers: Record<string, User>;
  users: User[];
  currentProject: any;
}

export default function MemberManagement({
  projectId,
  currentUser,
  projectMembers,
  users,
  currentProject
}: MemberManagementProps) {
  const router = useRouter();
  const { updateProject, removeProjectMembers, addProjectMembers } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preparar y mostrar las iniciales del usuario
  const getInitials = (user: User | null | undefined) => {
    if (!user || !user.firstName || !user.lastName) return '??';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  // Preparar y mostrar el nombre completo del usuario
  const getFullName = (user: User | null | undefined) => {
    if (!user) return 'Usuario Desconocido';
    if (!user.firstName && !user.lastName) return `Usuario ${user.id?.substring(0, 4) || ''}`;
    return `${user.firstName || ''} ${user.lastName || ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium mb-6">Gestión de Miembros del Proyecto</h2>
      
      {/* Lista de miembros actuales */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Miembros Actuales ({currentProject.members.length})</h3>
        
        {currentProject.members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {currentProject.members
              .filter((memberId: string, index: number) => 
                currentProject.members.indexOf(memberId) === index &&
                typeof memberId === 'string' && 
                memberId.length > 0
              )
              .map((memberId: string) => {
                const member = projectMembers[memberId] || users.find(u => u.id === memberId);
                const isCreator = memberId === (typeof currentProject.createdBy === 'object' 
                  ? currentProject.createdBy.id 
                  : currentProject.createdBy);
                
                return (
                  <div key={memberId} className={`flex items-center p-3 border rounded-lg ${isCreator ? 'bg-blue-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isCreator ? 'bg-blue-200' : 'bg-gray-200'}`}>
                      <span className={`font-medium ${isCreator ? 'text-blue-700' : 'text-gray-600'}`}>
                        {member?.firstName?.charAt(0) || '?'}{member?.lastName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {getFullName(member)}
                        </p>
                        {isCreator && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            Creador
                          </span>
                        )}
                      </div>
                      {member && <p className="text-sm text-gray-500">{member.email}</p>}
                    </div>
                    {!isCreator && (
                      <button
                        onClick={async () => {
                          setIsRemoving(true);
                          setRemovingId(memberId);
                          setError(null);
                          
                          try {
                            // Usar la función específica para remover miembros
                            const result = await removeProjectMembers(projectId, [memberId]);
                            
                            if (result) {
                              console.log("Miembro eliminado correctamente:", memberId);
                              
                              // Forzar la recarga del proyecto actual
                              const updatedProject = useProjectStore.getState().getProjectById(projectId);
                              if (updatedProject) {
                                // Actualizar la UI localmente sin recargar la página
                                const updatedProject = {...currentProject};
                                updatedProject.members = updatedProject.members.filter(id => id !== memberId);
                                
                                // Forzar actualización de la UI
                                router.refresh();
                              }
                            } else {
                              setError("No se pudo eliminar el miembro. Intente nuevamente.");
                            }
                          } catch (error) {
                            console.error('Error al eliminar miembro:', error);
                            setError("Error al eliminar el miembro.");
                          } finally {
                            setIsRemoving(false);
                            setRemovingId(null);
                          }
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Eliminar miembro"
                        disabled={isRemoving}
                      >
                        {isRemoving && removingId === memberId ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UserMinus size={18} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">Este proyecto no tiene miembros asignados.</p>
        )}
      </div>
      
      {/* Sección para agregar usuarios */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Agregar Usuarios al Proyecto</h3>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="max-h-80 overflow-y-auto border rounded-md mb-6">
          {users.filter(user => 
            user && 
            !currentProject.members.includes(user.id) &&
            (
              searchTerm === '' ||
              user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          ).length > 0 ? (
            users
              .filter(user => 
                user && 
                !currentProject.members.includes(user.id) &&
                (
                  searchTerm === '' ||
                  user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .slice(0, 10)
              .map(user => (
                <div 
                  key={user.id}
                  className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={async () => {
                    // Agregar el usuario al proyecto
                    setError(null);
                    
                    try {
                      // Usar la función específica para agregar miembros
                      const result = await addProjectMembers(projectId, [user.id]);
                      
                      if (result) {
                        console.log("Miembro agregado correctamente:", user.id);
                        // Forzar la recarga del proyecto actual
                        const updatedProject = useProjectStore.getState().getProjectById(projectId);
                        if (updatedProject) {
                          // No usar window.location.reload() para evitar el problema de login
                          router.refresh();
                        }
                      } else {
                        setError("No se pudo agregar el miembro. Intente nuevamente.");
                      }
                    } catch (error) {
                      console.error('Error al agregar miembro:', error);
                      setError("Error al agregar el miembro.");
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span className="text-gray-500 font-medium">
                      {user.firstName?.charAt(0) || '?'}{user.lastName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="ml-2">
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <UserPlus size={16} />
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center py-4 text-gray-500">
              {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles para agregar'}
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={() => {
              router.push(`/projects/${currentProject.id}`);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver a Información General
          </button>
        </div>
      </div>
    </div>
  );
}