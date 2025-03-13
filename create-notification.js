const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Crear una nueva notificación para Ivan Zarate
    const newNotification = await prisma.notification.create({
      data: {
        type: 'task_assigned',
        content: 'Se te ha asignado una nueva tarea: Revisar documentación',
        fromId: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f', // ID de Maximiliano Scarimbolo
        toId: '857af152-2fd5-4a4b-a8cb-468fc2681f5c',   // ID de Ivan Zarate
        isRead: false
      }
    });
    
    console.log('Notificación creada exitosamente:');
    console.log(newNotification);
    
  } catch (error) {
    console.error('Error al crear la notificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 