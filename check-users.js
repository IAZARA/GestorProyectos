const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    
    console.log('Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Nombre: ${user.firstName} ${user.lastName}, Email: ${user.email}, Rol: ${user.role}`);
    });
    
    // Buscar específicamente a Maxi Scarimbolo
    const maxi = await prisma.user.findFirst({
      where: {
        email: { contains: 'maxi.scarimbolo' }
      }
    });
    
    if (maxi) {
      console.log('\nInformación detallada de Maxi Scarimbolo:');
      console.log(maxi);
    } else {
      console.log('\nNo se encontró a Maxi Scarimbolo en la base de datos');
    }
    
    // Buscar específicamente a Ivan Zarate
    const ivan = await prisma.user.findFirst({
      where: {
        email: 'ivan.zarate@minseg.gob.ar'
      }
    });
    
    if (ivan) {
      console.log('\nInformación detallada de Ivan Zarate:');
      console.log(ivan);
    } else {
      console.log('\nNo se encontró a Ivan Zarate en la base de datos');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 