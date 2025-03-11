import { NextResponse } from 'next/server';
import { useUserStore } from '../../../store/userStore';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const success = await useUserStore.getState().resetUserPassword(email, password);
    
    if (!success) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la contraseña' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 