'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';

export default function MakeAdmin() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const { users, updateUser } = useUserStore();

  const makeAdmin = async () => {
    try {
      setStatus('loading');
      setMessage('Verificando usuario...');
      
      // Buscar al usuario por email
      const user = users.find(u => u.email === 'ivan.zarate@minseg.gob.ar');
      
      if (!user) {
        setStatus('error');
        setMessage('Usuario no encontrado: ivan.zarate@minseg.gob.ar');
        return;
      }
      
      // Verificar si ya es administrador
      if (user.role === 'Administrador') {
        setStatus('success');
        setMessage('El usuario ivan.zarate@minseg.gob.ar ya tiene el rol de Administrador.');
        return;
      }
      
      // Actualizar el rol a Administrador
      const updatedUser = await updateUser(user.id, { role: 'Administrador' });
      
      if (updatedUser) {
        setStatus('success');
        setMessage('¡El usuario ivan.zarate@minseg.gob.ar ahora tiene el rol de Administrador!');
      } else {
        setStatus('error');
        setMessage('Error al actualizar el rol del usuario.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Configuración de Administrador</h2>
      
      {status === 'idle' && (
        <button
          onClick={makeAdmin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Hacer Administrador a ivan.zarate@minseg.gob.ar
        </button>
      )}
      
      {status === 'loading' && (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{message}</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
    </div>
  );
} 