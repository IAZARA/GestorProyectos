const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener los usuarios
    const users = await prisma.user.findMany();
    
    if (users.length < 2) {
      console.error('No hay suficientes usuarios para crear una notificación');
      return;
    }
    
    // Usar el primer usuario como remitente y el segundo como destinatario
    const fromUser = users[0]; // Maximiliano Scarimbolo
    const toUser = users[2];   // Ivan Zarate
    
    console.log(`Creando notificación de prueba de ${fromUser.firstName} ${fromUser.lastName} a ${toUser.firstName} ${toUser.lastName}`);
    
    // Crear una notificación de prueba
    const notification = await prisma.notification.create({
      data: {
        type: 'project_added',
        content: `${fromUser.firstName} ${fromUser.lastName} te ha añadido al proyecto "Proyecto de prueba"`,
        fromId: fromUser.id,
        toId: toUser.id,
        isRead: false
      }
    });
    
    console.log('Notificación creada con éxito:', notification);
  } catch (error) {
    console.error('Error al crear la notificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 