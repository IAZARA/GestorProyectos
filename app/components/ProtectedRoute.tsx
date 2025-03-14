'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';

export default function ProtectedRoute({
  children,
  requiredRole = null,
}: {
  children: React.ReactNode;
  requiredRole?: string | null;
}) {
  const router = useRouter();
  const { currentUser, checkAuthState } = useUserStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Verificar el estado de autenticación al cargar el componente
      if (!currentUser) {
        await checkAuthState();
      }
      
      // Verificar si el usuario está autenticado
      const isAuthenticated = currentUser !== null;
      
      console.log('Estado de autenticación:', {
        hasCurrentUser: currentUser !== null,
        isAuthenticated,
        userRole: currentUser?.role
      });
      
      // Si no está autenticado, redirigir al login
      if (!isAuthenticated) {
        console.log('No autenticado, redirigiendo a login...');
        
        // Guardar la ruta actual para redireccionar después del login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            localStorage.setItem('redirectAfterLogin', currentPath);
          }
        }
        
        router.push('/login');
        return;
      }
      
      // Si está autenticado, verificar el rol si es necesario
      if (isAuthenticated && requiredRole) {
        // Verificar si el usuario tiene el rol requerido
        const userRole = currentUser.role;
        console.log('Verificando rol:', { requiredRole, userRole });
        
        // Permitir acceso si el rol coincide exactamente o si el usuario es administrador
        // También permitir acceso a gestores si el rol requerido es "Gestor"
        const hasRequiredRole = 
          userRole === requiredRole || 
          userRole === 'Administrador' || 
          (requiredRole === 'Gestor' && userRole === 'Gestor');
        
        if (!hasRequiredRole) {
          console.log(`Rol requerido: ${requiredRole}, rol actual: ${userRole}, acceso denegado`);
          router.push('/dashboard');
          return;
        }
      }
      
      // Usuario autenticado y con el rol correcto
      setIsAuthorized(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [currentUser, router, requiredRole, checkAuthState]);

  // Mientras se está cargando o verificando la autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Cargando...</p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  return isAuthorized ? <>{children}</> : null;
}