import { NextResponse } from 'next/server';
import { useUserStore } from '../../../store/userStore';

export async function GET() {
  try {
    const users = useUserStore.getState().users;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 