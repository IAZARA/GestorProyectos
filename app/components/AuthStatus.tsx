'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { currentUser, logout, getUserById } = useUserStore();
  const { data: session, status, update: updateSession } = useSession();
  const [storeAuth, setStoreAuth] = useState<string>('Cargando...');
  const [nextAuthStatus, setNextAuthStatus] = useState<string>('Cargando...');
  const router = useRouter();

  useEffect(() => {
    // Verificar estado de autenticación del store
    if (currentUser) {
      setStoreAuth(`Autenticado como: ${currentUser.email} (${currentUser.role})`);
    } else {
      setStoreAuth('No autenticado en el store');
    }

    // Verificar estado de autenticación de NextAuth
    if (session) {
      setNextAuthStatus(`Autenticado como: ${session.user?.email} (${session.user?.role || 'Sin rol'})`);
      
      // Si hay sesión en NextAuth pero no hay usuario en el store, intentamos sincronizar
      if (!currentUser && session.user?.id) {
        const userFromStore = getUserById(session.user.id);
        if (userFromStore) {
          console.log('Sincronizando usuario de NextAuth con el store');
          // Aquí podríamos establecer el usuario actual en el store
        }
      }
    } else {
      setNextAuthStatus('No autenticado en NextAuth');
    }
    
    // Log para depuración
    console.log('Estado de autenticación:', {
      store: currentUser ? `${currentUser.email} (${currentUser.role})` : 'No autenticado',
      nextAuth: session ? `${session.user?.email} (${session.user?.role || 'Sin rol'})` : 'No autenticado',
      nextAuthStatus: status
    });
  }, [currentUser, session, status, getUserById]);

  const handleLogout = async () => {
    // Cerrar sesión en el store
    logout();
    
    // Cerrar sesión en NextAuth
    await signOut({ redirect: false });
    
    // Redirigir a la página de login
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Estado de Autenticación</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Store (Zustand):</h3>
        <p className={currentUser ? "text-green-600" : "text-red-600"}>
          {storeAuth}
        </p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">NextAuth:</h3>
        <p className={session ? "text-green-600" : "text-red-600"}>
          {nextAuthStatus}
        </p>
      </div>
      
      {(currentUser || session) && (
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