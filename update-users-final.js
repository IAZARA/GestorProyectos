/**
 * Script para sincronizar los usuarios en la base de datos con los que se muestran en la interfaz
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUsers() {
  try {
    console.log('Iniciando sincronización de usuarios...');
    
    // Datos de los usuarios que queremos tener (basados en la interfaz)
    const targetUsers = [
      {
        email: 'hernan.salvatore@minseg.gob.ar',
        firstName: 'Hernan',
        lastName: 'Salvatore',
        role: 'Usuario',
        expertise: 'Administrativo',
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
    
    // Obtener usuarios existentes
    const existingUsers = await prisma.user.findMany();
    console.log(`Se encontraron ${existingUsers.length} usuarios en la base de datos.`);
    
    // Mapear emails existentes para facilitar la búsqueda
    const existingEmails = new Set(existingUsers.map(user => user.email));
    
    // Procesar cada usuario objetivo
    for (const userData of targetUsers) {
      if (existingEmails.has(userData.email)) {
        console.log(`Usuario con email ${userData.email} ya existe. Actualizando datos...`);
        
        // Buscar el usuario por email
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        
        // Encriptar contraseña si se proporciona
        let dataToUpdate = { ...userData };
        if (dataToUpdate.password) {
          const salt = await bcrypt.genSalt(12);
          dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt);
        }
        
        // Actualizar usuario
        await prisma.user.update({
          where: { id: existingUser.id },
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
    
    // Eliminar usuarios que no están en la lista objetivo
    const targetEmails = new Set(targetUsers.map(user => user.email));
    for (const existingUser of existingUsers) {
      if (!targetEmails.has(existingUser.email)) {
        console.log(`Eliminando usuario ${existingUser.email} que no está en la lista objetivo...`);
        
        await prisma.user.delete({
          where: { id: existingUser.id }
        });
        
        console.log(`Usuario ${existingUser.email} eliminado correctamente.`);
      }
    }
    
    // Verificar usuarios actualizados
    const updatedUsers = await prisma.user.findMany();
    console.log(`Ahora hay ${updatedUsers.length} usuarios en la base de datos:`);
    for (const user of updatedUsers) {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    }
    
    console.log('Sincronización de usuarios completada con éxito.');
  } catch (error) {
    console.error('Error al sincronizar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updateUsers();
