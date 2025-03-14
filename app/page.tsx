'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../store/userStore';
import MakeAdmin from './components/MakeAdmin';

export default function Home() {
  const router = useRouter();
  const { currentUser, checkAuthState } = useUserStore();
  const [showAdminTool, setShowAdminTool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initAuth = async () => {
      // Verificar el estado de autenticación al cargar la página
      if (!currentUser) {
        await checkAuthState();
      }
      
      setIsLoading(false);
      
      if (currentUser) {
        // Si el usuario ya está autenticado, redirigir según su rol
        if (currentUser.role === 'Administrador') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Si no está autenticado, redirigir al login
        router.push('/login');
      }
    };
    
    initAuth();
  }, [router, currentUser, checkAuthState]);
  
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
        <p className="text-gray-600 mb-8">
          {isLoading ? 'Verificando sesión...' : 'Redirigiendo...'}
        </p>
        
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