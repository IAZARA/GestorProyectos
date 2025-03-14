/**
 * Script para resetear las contraseñas de todos los usuarios a "password123"
 * Utiliza el mismo método de hashing para todos los usuarios
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAllPasswords() {
  try {
    console.log('Iniciando reseteo de contraseñas...');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    
    // Contraseña estándar para todos los usuarios
    const standardPassword = 'password123';
    
    // Generar un salt único para todos los usuarios
    // Esto asegura que todos los usuarios tengan exactamente el mismo hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(standardPassword, salt);
    
    console.log(`Hash generado para la contraseña "${standardPassword}": ${hashedPassword}`);
    console.log(`Longitud del hash: ${hashedPassword.length} caracteres`);
    
    // Actualizar la contraseña de cada usuario con el mismo hash
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Contraseña actualizada para ${user.firstName} ${user.lastName} (${user.email})`);
    }
    
    console.log('Reseteo de contraseñas completado con éxito.');
    console.log(`Todos los usuarios ahora pueden iniciar sesión con la contraseña: ${standardPassword}`);
  } catch (error) {
    console.error('Error al resetear contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
resetAllPasswords();
