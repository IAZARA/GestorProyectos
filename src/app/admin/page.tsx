'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const router = useRouter();
  
  // Datos de ejemplo para usuarios
  const users = [
    {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@sistema.com',
      role: 'Administrador',
      expertise: 'Administrativo'
    },
    {
      id: '2',
      name: 'Gestor Proyectos',
      email: 'gestor@sistema.com',
      role: 'Gestor',
      expertise: 'Tecnico'
    },
    {
      id: '3',
      name: 'Usuario Normal',
      email: 'usuario@sistema.com',
      role: 'Usuario',
      expertise: 'Legal'
    }
  ];
  
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Volver al Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
            <p className="text-4xl font-bold">{users.length}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Proyectos</h2>
            <p className="text-4xl font-bold">3</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Tareas</h2>
            <p className="text-4xl font-bold">16</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Nuevo Usuario
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expertise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'Administrador' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'Gestor' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.expertise}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Editar
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 