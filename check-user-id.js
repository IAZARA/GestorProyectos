const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar el usuario Ivan Zarate en la base de datos
    const ivanDB = await prisma.user.findFirst({
      where: {
        email: 'ivan.zarate@minseg.gob.ar'
      }
    });
    
    console.log('Usuario Ivan Zarate en la base de datos:');
    console.log(ivanDB);
    
    // Buscar notificaciones para Ivan Zarate
    const notifications = await prisma.notification.findMany({
      where: {
        toId: ivanDB?.id
      }
    });
    
    console.log(`\nNotificaciones para Ivan Zarate (ID: ${ivanDB?.id}):`);
    console.log(notifications);
    
    // Verificar si hay alguna discrepancia en los IDs
    const notificationsForB9e11de8 = await prisma.notification.findMany({
      where: {
        toId: 'b9e11de8-e612-4abd-b59d-ce3109a9820b'
      }
    });
    
    console.log('\nNotificaciones para ID b9e11de8-e612-4abd-b59d-ce3109a9820b:');
    console.log(notificationsForB9e11de8);
    
    // Verificar si existe un usuario con ese ID
    const userWithB9e11de8 = await prisma.user.findUnique({
      where: {
        id: 'b9e11de8-e612-4abd-b59d-ce3109a9820b'
      }
    });
    
    console.log('\nUsuario con ID b9e11de8-e612-4abd-b59d-ce3109a9820b:');
    console.log(userWithB9e11de8);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 