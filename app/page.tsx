'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MakeAdmin from './components/MakeAdmin';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showAdminTool, setShowAdminTool] = useState(false);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Si el usuario ya está autenticado, redirigir según su rol
      if (session.user.role === 'Administrador') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      // Si no está autenticado, redirigir al login
      router.push('/login');
    }
  }, [router, status, session]);
  
  // Mostrar herramienta de administrador con Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminTool(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Gestor de Proyectos</h1>
        <p className="text-gray-600 mb-8">Redirigiendo...</p>
        
        {showAdminTool && (
          <div className="mt-8">
            <MakeAdmin />
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-400">
          Presiona Ctrl+Shift+A para acceder a herramientas de administrador
        </div>
      </div>
    </main>
  );
} 