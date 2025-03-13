const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener los usuarios
    const ivan = await prisma.user.findFirst({
      where: { email: 'ivan.zarate@minseg.gob.ar' }
    });
    
    const maxi = await prisma.user.findFirst({
      where: { email: 'maxi.scarimbolo@minseg.gob.ar' }
    });
    
    if (!ivan || !maxi) {
      console.error('No se encontraron los usuarios necesarios');
      return;
    }
    
    console.log('Usuarios encontrados:');
    console.log(`Ivan Zarate: ${ivan.id}`);
    console.log(`Maxi Scarimbolo: ${maxi.id}`);
    
    // Crear una notificación de Ivan para Maxi
    const notificationFromIvanToMaxi = await prisma.notification.create({
      data: {
        type: 'project_added',
        content: 'Ivan Zarate te ha añadido al proyecto "Proyecto de prueba de Ivan"',
        fromId: ivan.id,
        toId: maxi.id,
        isRead: false
      }
    });
    
    console.log('\nNotificación creada de Ivan para Maxi:');
    console.log(notificationFromIvanToMaxi);
    
    // Crear una notificación de Maxi para Ivan
    const notificationFromMaxiToIvan = await prisma.notification.create({
      data: {
        type: 'project_added',
        content: 'Maximiliano Scarimbolo te ha añadido al proyecto "Proyecto de prueba de Maxi"',
        fromId: maxi.id,
        toId: ivan.id,
        isRead: false
      }
    });
    
    console.log('\nNotificación creada de Maxi para Ivan:');
    console.log(notificationFromMaxiToIvan);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();