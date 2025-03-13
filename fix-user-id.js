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
    
    // Verificar si existe un usuario con el ID b9e11de8-e612-4abd-b59d-ce3109a9820b
    const userWithB9e11de8 = await prisma.user.findUnique({
      where: {
        id: 'b9e11de8-e612-4abd-b59d-ce3109a9820b'
      }
    });
    
    if (userWithB9e11de8) {
      console.log('Ya existe un usuario con el ID b9e11de8-e612-4abd-b59d-ce3109a9820b:');
      console.log(userWithB9e11de8);
      console.log('No se puede continuar porque ya existe un usuario con ese ID');
      return;
    }
    
    // Mover las notificaciones al ID b9e11de8-e612-4abd-b59d-ce3109a9820b
    const notifications = await prisma.notification.findMany({
      where: {
        toId: ivanDB.id
      }
    });
    
    console.log(`Moviendo ${notifications.length} notificaciones al ID b9e11de8-e612-4abd-b59d-ce3109a9820b...`);
    
    // Crear una notificación de prueba para el ID b9e11de8-e612-4abd-b59d-ce3109a9820b
    const newNotification = await prisma.notification.create({
      data: {
        type: 'project_added',
        content: 'Maximiliano Scarimbolo te ha añadido al proyecto "Proyecto de prueba para b9e11de8"',
        fromId: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f',
        toId: 'b9e11de8-e612-4abd-b59d-ce3109a9820b',
        isRead: false
      }
    });
    
    console.log('Notificación de prueba creada:');
    console.log(newNotification);
    
    // Verificar que la notificación se haya creado correctamente
    const newNotifications = await prisma.notification.findMany({
      where: {
        toId: 'b9e11de8-e612-4abd-b59d-ce3109a9820b'
      }
    });
    
    console.log(`Notificaciones para el ID b9e11de8-e612-4abd-b59d-ce3109a9820b (${newNotifications.length}):`);
    console.log(newNotifications);
    
    console.log('Proceso completado con éxito');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 