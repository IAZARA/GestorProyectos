'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { currentUser, logout, checkAuthState } = useUserStore();
  const [authStatus, setAuthStatus] = useState<string>('Cargando...');
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      // Verificar el estado de autenticación al cargar el componente
      if (!currentUser) {
        await checkAuthState();
      }
      
      // Actualizar el estado de autenticación
      if (currentUser) {
        setAuthStatus(`Autenticado como: ${currentUser.email} (${currentUser.role})`);
      } else {
        setAuthStatus('No autenticado');
      }
    };
    
    initAuth();
  }, [currentUser, checkAuthState]);

  const handleLogout = async () => {
    // Cerrar sesión en el store
    await logout();
    
    // Redirigir a la página de login
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Estado de Autenticación</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Estado:</h3>
        <p className={currentUser ? "text-green-600" : "text-red-600"}>
          {authStatus}
        </p>
      </div>
      
      {currentUser && (
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      )}
    </div>
  );
}