/**
 * Script para actualizar las contraseñas de todos los usuarios
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    console.log('Iniciando actualización de contraseñas...');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    
    // Contraseña estándar para todos los usuarios
    const standardPassword = 'password123';
    
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(standardPassword, salt);
    
    // Actualizar la contraseña de cada usuario
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Contraseña actualizada para ${user.firstName} ${user.lastName} (${user.email})`);
    }
    
    console.log('Actualización de contraseñas completada con éxito.');
  } catch (error) {
    console.error('Error al actualizar contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
updatePasswords();
