'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MakeAdmin from '../components/MakeAdmin';

export default function MakeAdminPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Configuración de Administrador</h1>
        
        <MakeAdmin />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
} 