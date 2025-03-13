const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Crear una nueva notificación para Maxi Scarimbolo
    const newNotification = await prisma.notification.create({
      data: {
        type: 'project_added',
        content: 'Ivan Zarate te ha añadido al proyecto "Proyecto de prueba para Maxi"',
        fromId: '857af152-2fd5-4a4b-a8cb-468fc2681f5c', // ID de Ivan Zarate
        toId: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f',   // ID de Maxi Scarimbolo
        isRead: false
      }
    });
    
    console.log('Notificación creada exitosamente para Maxi Scarimbolo:');
    console.log(newNotification);
    
  } catch (error) {
    console.error('Error al crear la notificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();