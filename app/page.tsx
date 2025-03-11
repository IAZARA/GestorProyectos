'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
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
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Gestor de Proyectos</h1>
        <p className="text-gray-600 mb-8">Redirigiendo...</p>
      </div>
    </main>
  );
} 