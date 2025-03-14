/**
 * Script para actualizar usuarios en la base de datos
 * Este script actualiza los correos electrónicos de los usuarios existentes
 * y crea nuevos usuarios si es necesario
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUsers() {
  try {
    console.log('Iniciando actualización de usuarios...');
    
    // Obtener usuarios existentes
    const existingUsers = await prisma.user.findMany();
    console.log(`Se encontraron ${existingUsers.length} usuarios en la base de datos.`);
    
    // Datos de los usuarios que queremos tener
    const targetUsers = [
      {
        email: 'ivan.zarate@minseg.gob.ar',
        firstName: 'Iván',
        lastName: 'Zarate',
        role: 'Administrador',
        expertise: 'Tecnico',
        password: 'password123'
      },
      {
        email: 'maxi.scarimbolo@minseg.gob.ar',
        firstName: 'Maxi',
        lastName: 'Scarimbolo',
        role: 'Usuario',
        expertise: 'Tecnico',
        password: 'password123'
      },
      {
        email: 'sofi.varela@minseg.gob.ar',
        firstName: 'Sofia',
        lastName: 'Varela',
        role: 'Usuario',
        expertise: 'Administrativo',
        password: 'password123'
      }
    ];
    
    // Procesar cada usuario objetivo
    for (const userData of targetUsers) {
      // Buscar si el usuario ya existe por email
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`Usuario con email ${userData.email} ya existe. Actualizando datos...`);
        
        // Encriptar contraseña si se proporciona
        let dataToUpdate = { ...userData };
        if (dataToUpdate.password) {
          const salt = await bcrypt.genSalt(12);
          dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt);
        }
        
        // Actualizar usuario
        await prisma.user.update({
          where: { email: userData.email },
          data: dataToUpdate
        });
        
        console.log(`Usuario ${userData.email} actualizado correctamente.`);
      } else {
        console.log(`Usuario con email ${userData.email} no existe. Creando nuevo usuario...`);
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Crear usuario
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        });
        
        console.log(`Usuario ${userData.email} creado correctamente.`);
      }
    }
    
    console.log('Actualización de usuarios completada.');
  } catch (error) {
    console.error('Error al actualizar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updateUsers();
