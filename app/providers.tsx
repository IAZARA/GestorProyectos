'use client';

import { SessionProvider } from 'next-auth/react';
import AutoMakeAdmin from './components/AutoMakeAdmin';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AutoMakeAdmin />
      {children}
    </SessionProvider>
  );
} 