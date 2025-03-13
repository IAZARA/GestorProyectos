import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // Obtener el email de la URL
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro email' },
        { status: 400 }
      );
    }
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        createdAt: true
      }
    });
    
    // Devolver si existe o no
    return NextResponse.json({
      exists: !!user,
      user: user || null
    });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return NextResponse.json(
      { error: 'Error al verificar usuario' },
      { status: 500 }
    );
  }
} 