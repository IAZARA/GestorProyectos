import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dirección Nacional de Gestión de Bases de Datos de Seguridad',
  description: 'Sistema de gestión de proyectos para la Dirección Nacional',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2d2c55" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} h-full`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}