'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import Image from 'next/image';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Intentar iniciar sesión con nuestra API personalizada
      const user = await login(email, password);
      
      if (user) {
        console.log('Login exitoso para:', email);
        
        // Verificar si hay una redirección pendiente
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        
        // Redirigir al dashboard o a la página guardada con un pequeño retraso
        setTimeout(() => {
          if (redirectPath) {
            console.log('Redirigiendo a:', redirectPath);
            localStorage.removeItem('redirectAfterLogin'); // Limpiar después de usar
            router.push(redirectPath);
          } else {
            console.log('Redirigiendo al dashboard...');
            router.push('/dashboard');
          }
        }, 800);
      } else {
        console.error('Login fallido para:', email);
        setError('Email o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Image 
              src="/images/escudo.png" 
              alt="Logo" 
              width={80}
              height={80}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#2d2c55]">
            Dirección Nacional de Gestión de Bases de Datos de Seguridad
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ministerio de Seguridad Nacional
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#2d2c55] sm:text-sm sm:leading-6 px-2"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Contraseña
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#2d2c55] sm:text-sm sm:leading-6 px-2"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-[#2d2c55] px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2d2c55] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}