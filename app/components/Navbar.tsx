'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { LogOut, User, ChevronDown, Settings, Menu, X } from 'lucide-react';
import Image from 'next/image';
import NotificationCenter from './NotificationCenter';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Este efecto se ejecuta solo en el cliente después de la hidratación
  useEffect(() => {
    setIsMounted(true);
    
    // Cerrar el menú cuando se hace clic fuera de él
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Log para depuración
  useEffect(() => {
    if (isMounted) {
      console.log('Estado de Navbar:', {
        hasCurrentUser: !!currentUser,
        userEmail: currentUser?.email || 'No disponible'
      });
    }
  }, [isMounted, currentUser]);

  const handleSignOut = async () => {
    logout();
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  // No mostrar la barra de navegación en la página de login
  if (pathname === '/login') {
    return null;
  }

  // Renderizamos un div vacío durante la hidratación para evitar discrepancias
  if (!isMounted) {
    return <div className="bg-[#2d2c55] shadow-sm h-16"></div>;
  }

  // Solo mostramos el contenido real después de la hidratación
  const shouldShowNavbar = isMounted && currentUser;
  
  // Determinar qué información de usuario mostrar
  const userDisplayName = currentUser?.firstName || 'Usuario';
  const userInitials = currentUser 
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`
    : 'U';
  const userPhotoUrl = currentUser?.photoUrl || '';

  if (!shouldShowNavbar) {
    return <div className="bg-[#2d2c55] shadow-sm h-16"></div>;
  }

  // Enlaces de navegación principales
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', active: pathname === '/dashboard' },
    { name: 'Proyectos', path: '/projects', active: pathname?.startsWith('/projects') || false },
    { name: 'Calendario', path: '/calendar', active: pathname === '/calendar' },
    { name: 'Tareas', path: '/tasks', active: pathname === '/tasks' },
  ];

  return (
    <nav className="bg-[#2d2c55] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título - visible en todos los tamaños */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-white hover:text-gray-200"
            >
              <div className="h-10 w-10 relative mr-3">
                <Image 
                  src="/images/escudo.png" 
                  alt="Logo" 
                  width={40}
                  height={40}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span className="font-medium text-sm md:text-base hidden sm:inline">
                Dirección Nacional de Gestión de Bases de Datos
              </span>
              <span className="font-medium text-sm sm:hidden">
                DNGBD
              </span>
            </button>
          </div>

          {/* Enlaces de navegación - solo visibles en pantallas medianas y grandes */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  link.active 
                    ? 'bg-[#3d3c75] text-white' 
                    : 'text-gray-300 hover:bg-[#3d3c75] hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Perfil de usuario y notificaciones */}
          <div className="flex items-center">
            <div className="mr-2 md:mr-4">
              <NotificationCenter />
            </div>
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-white hover:text-gray-200 focus:outline-none"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={`Foto de perfil`}
                    className="h-8 w-8 rounded-full mr-2 object-cover border-2 border-white"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-2">
                    <span className="text-[#2d2c55] font-medium">
                      {userInitials}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline mr-1">
                  {userDisplayName}
                </span>
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

                  {currentUser?.role === 'Administrador' && (
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

            {/* Botón de menú móvil - solo visible en pantallas pequeñas */}
            <div className="ml-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-[#3d3c75] focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú móvil - solo visible cuando está abierto en pantallas pequeñas */}
      <div 
        ref={mobileMenuRef}
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#2d2c55] border-t border-[#3d3c75]">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigation(link.path)}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                link.active 
                  ? 'bg-[#3d3c75] text-white' 
                  : 'text-gray-300 hover:bg-[#3d3c75] hover:text-white'
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}