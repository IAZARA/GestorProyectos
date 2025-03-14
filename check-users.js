/**
 * Script para verificar los usuarios en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Obteniendo lista de usuarios...');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios`);
    
    // Mostrar información de cada usuario
    users.forEach((user, index) => {
      console.log(`\n[${index + 1}] ${user.firstName} ${user.lastName}`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Rol: ${user.role}`);
      console.log(`Especialidad: ${user.expertise}`);
    });
    
  } catch (error) {
    console.error(`Error al obtener usuarios: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
main(); 