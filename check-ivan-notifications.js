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
    
    if (!ivanDB) {
      console.error('No se encontró el usuario Ivan Zarate en la base de datos');
      return;
    }
    
    console.log('Usuario Ivan Zarate en la base de datos:');
    console.log(ivanDB);
    
    // Buscar notificaciones para Ivan Zarate
    const notifications = await prisma.notification.findMany({
      where: {
        toId: ivanDB.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\nNotificaciones para Ivan Zarate (ID: ${ivanDB.id}): ${notifications.length}`);
    console.log(notifications);
    
    // Si no hay notificaciones, crear una de prueba
    if (notifications.length === 0) {
      console.log('\nCreando notificación de prueba para Ivan Zarate...');
      
      // Buscar el usuario Maximiliano Scarimbolo
      const maxiDB = await prisma.user.findFirst({
        where: {
          email: 'maxi.scarimbolo@minseg.gob.ar'
        }
      });
      
      if (!maxiDB) {
        console.error('No se encontró el usuario Maximiliano Scarimbolo en la base de datos');
        return;
      }
      
      // Crear una notificación de prueba
      const newNotification = await prisma.notification.create({
        data: {
          type: 'project_added',
          content: `Maximiliano Scarimbolo te ha añadido al proyecto "Proyecto de prueba para Ivan"`,
          fromId: maxiDB.id,
          toId: ivanDB.id,
          isRead: false
        }
      });
      
      console.log('Notificación de prueba creada:');
      console.log(newNotification);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 