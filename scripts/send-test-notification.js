const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendTestNotification() {
  console.log('Enviando notificación de prueba...');

  try {
    // 1. Verificar IDs de usuarios conocidos
    const ivanId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
    const maxiId = 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f';

    const ivan = await prisma.user.findUnique({ where: { id: ivanId } });
    const maxi = await prisma.user.findUnique({ where: { id: maxiId } });

    console.log('Usuario Ivan:', ivan ? `${ivan.firstName} ${ivan.lastName} (${ivan.id})` : 'No encontrado');
    console.log('Usuario Maxi:', maxi ? `${maxi.firstName} ${maxi.lastName} (${maxi.id})` : 'No encontrado');

    // 2. Crear una notificación de prueba de Ivan a Maxi
    console.log('Creando notificación de prueba de Ivan a Maxi...');
    const testNotification = await prisma.notification.create({
      data: {
        type: 'test_notification',
        content: 'Esta es una notificación de prueba URGENTE - ' + new Date().toLocaleTimeString(),
        fromId: ivanId,
        toId: maxiId,
        isRead: false
      },
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true
          }
        }
      }
    });
    console.log(`Notificación de prueba creada con ID: ${testNotification.id}`);

    // 3. Verificar notificaciones para Maxi
    const maxiNotifications = await prisma.notification.findMany({
      where: { toId: maxiId },
      include: { from: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Últimas 5 notificaciones para Maxi:`);
    maxiNotifications.forEach(n => {
      console.log(`- [${n.isRead ? 'Leída' : 'No leída'}] ${n.type}: ${n.content} (De: ${n.from?.firstName || 'Desconocido'})`);
    });

    console.log('Notificación de prueba enviada con éxito.');
  } catch (error) {
    console.error('Error al enviar notificación de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendTestNotification(); 