import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario con este email ya existe' },
        { status: 400 }
      );
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Crear el usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        expertise: userData.expertise,
        role: userData.role,
        photoUrl: userData.photoUrl || ''
      }
    });
    
    // Devolver el usuario creado (sin la contraseña)
    const { password, ...userWithoutPassword } = newUser;
    
    console.log('Usuario creado en la base de datos:', userWithoutPassword);
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        expertise: true,
        role: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
} 