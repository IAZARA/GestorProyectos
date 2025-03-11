'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useUserStore } from '../../store/userStore';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useUserStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Primero intentamos iniciar sesión con el store local
      const user = login(email, password);
      
      if (user) {
        console.log("Usuario autenticado localmente:", user.firstName);
        
        // Luego iniciamos sesión con NextAuth
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          console.error("Error en NextAuth:", result.error);
          setError('Error al iniciar sesión con NextAuth');
          setIsLoading(false);
          return;
        }

        // Redirigir según el rol del usuario
        if (user.role === 'Administrador') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Credenciales incorrectas');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Iniciar sesión
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
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
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
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
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>

        <div className="mt-10 text-center text-sm text-gray-500">
          <p>Credenciales de prueba:</p>
          <p className="mt-1">Admin: admin@sistema.com / admin123</p>
          <p>Gestor: gestor@sistema.com / gestor123</p>
          <p>Usuario: usuario@sistema.com / usuario123</p>
        </div>
      </div>
    </div>
  );
} 