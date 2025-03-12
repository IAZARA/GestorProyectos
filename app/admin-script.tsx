'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';

export default function AdminScript() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { users, updateUser } = useUserStore();

  useEffect(() => {
    const makeUserAdmin = async () => {
      try {
        // Buscar al usuario por email
        const user = users.find(u => u.email === 'ivan.zarate@minseg.gob.ar');
        
        if (!user) {
          setError('Usuario no encontrado: ivan.zarate@minseg.gob.ar');
          return;
        }
        
        // Verificar si ya es administrador
        if (user.role === 'Administrador') {
          setMessage('El usuario ivan.zarate@minseg.gob.ar ya tiene el rol de Administrador.');
          return;
        }
        
        // Actualizar el rol a Administrador
        const updatedUser = await updateUser(user.id, { role: 'Administrador' });
        
        if (updatedUser) {
          setMessage('¡El usuario ivan.zarate@minseg.gob.ar ahora tiene el rol de Administrador!');
        } else {
          setError('Error al actualizar el rol del usuario.');
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    makeUserAdmin();
  }, [users, updateUser]);

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Script de Administración</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <p className="text-gray-600">
        Este script verifica y asegura que el usuario ivan.zarate@minseg.gob.ar tenga el rol de Administrador.
      </p>
    </div>
  );
} 