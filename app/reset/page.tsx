'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPage() {
  const [message, setMessage] = useState('Reiniciando la aplicación...');
  const router = useRouter();

  useEffect(() => {
    try {
      // Limpiar localStorage
      localStorage.clear();
      setMessage('LocalStorage limpiado. Redirigiendo...');
      
      // Esperar un momento y redirigir
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (error) {
      setMessage('Error al reiniciar: ' + error);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Reinicio del Sistema</h1>
        <p className="mb-4">{message}</p>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 