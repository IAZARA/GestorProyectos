import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

// Importar el adaptador
const { userAdapter } = require('../../../lib/db-adapter');

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Validar datos requeridos
    if (!userData.email) {
      return NextResponse.json(
        { error: 'Falta el email del usuario' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ya existe
    try {
      const { userService } = require('../../../lib/db');
      const existingUser = await userService.getUserByEmail(userData.email);
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'El usuario con este email ya existe' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error al verificar usuario existente:', error);
      // Continuar con la creación del usuario
    }
    
    // Hashear la contraseña si se proporciona
    let hashedPassword = '';
    if (userData.password) {
      try {
        const salt = await bcrypt.genSalt(12);
        hashedPassword = await bcrypt.hash(userData.password, salt);
      } catch (error) {
        console.error('Error al hashear contraseña:', error);
        // Continuar sin hashear la contraseña
      }
    }
    
    try {
      // Intentar crear el usuario con el adaptador
      const newUser = await userAdapter.createUser({
        firstName: userData.firstName || userData.first_name || 'Usuario',
        lastName: userData.lastName || userData.last_name || 'Sin Apellido',
        email: userData.email,
        role: userData.role || 'user',
        expertise: userData.expertise || 'Administrativo',
        password: hashedPassword
      });
      
      console.log('Usuario creado con adaptador:', newUser);
      
      return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
      console.error('Error al crear usuario con adaptador:', error);
      throw error;
    }
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
    // Usar el servicio de usuarios de Knex.js
    const { userService } = require('../../../lib/db');
    
    // Obtener todos los usuarios
    const users = await userService.getAllUsers();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
} 