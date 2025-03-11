'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useUserStore } from '../../store/userStore';
import { Home, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentUser } = useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    // Cerrar sesión en NextAuth
    await signOut({ redirect: false });
    
    // Cerrar sesión en el store
    useUserStore.getState().logout();
    
    // Redirigir al login
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowUserMenu(false);
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={handleDashboardClick}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <div className="h-10 w-10 relative mr-3">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo" 
                  fill 
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span className="font-medium text-sm md:text-base">
                Dirección Nacional de Gestión de Bases de Datos de Seguridad
              </span>
            </button>
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                    className="h-8 w-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <span className="text-gray-600 font-medium">
                      {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="mr-1">{currentUser.firstName}</span>
                <ChevronDown size={16} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User size={16} className="mr-2" />
                    Mi perfil
                  </button>
                  
                  {currentUser.role === 'Administrador' && (
                    <button
                      onClick={() => {
                        router.push('/admin');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings size={16} className="mr-2" />
                      Administración
                    </button>
                  )}
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 