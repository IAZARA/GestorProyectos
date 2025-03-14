'use client';

import { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import AutoMakeAdmin from './components/AutoMakeAdmin';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuthState } = useUserStore();

  useEffect(() => {
    // Verificar el estado de autenticación al cargar la aplicación
    checkAuthState();
  }, [checkAuthState]);

  return (
    <>
      <AutoMakeAdmin />
      {children}
    </>
  );
}