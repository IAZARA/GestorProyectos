'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';

export default function AutoMakeAdmin() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const { users, updateUser } = useUserStore();

  useEffect(() => {
    const makeAdmin = async () => {
      try {
        setStatus('loading');
        
        // Buscar al usuario por email
        const user = users.find(u => u.email === 'ivan.zarate@minseg.gob.ar');
        
        if (!user) {
          setStatus('error');
          console.error('Usuario no encontrado: ivan.zarate@minseg.gob.ar');
          return;
        }
        
        // Verificar si ya es administrador
        if (user.role === 'Administrador') {
          setStatus('success');
          console.log('El usuario ivan.zarate@minseg.gob.ar ya tiene el rol de Administrador.');
          return;
        }
        
        // Actualizar el rol a Administrador
        const updatedUser = await updateUser(user.id, { role: 'Administrador' });
        
        if (updatedUser) {
          setStatus('success');
          console.log('¡El usuario ivan.zarate@minseg.gob.ar ahora tiene el rol de Administrador!');
        } else {
          setStatus('error');
          console.error('Error al actualizar el rol del usuario.');
        }
      } catch (err) {
        setStatus('error');
        console.error('Error:', err);
      }
    };
    
    makeAdmin();
  }, [users, updateUser]);

  // Este componente no renderiza nada visible
  return null;
} 