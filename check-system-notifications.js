/**
 * Script para verificar las notificaciones de sistema en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Buscando notificaciones de sistema...');
    
    // Obtener las últimas notificaciones de sistema
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'system_message'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        from: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        to: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`Se encontraron ${notifications.length} notificaciones de sistema recientes.`);
    
    if (notifications.length > 0) {
      console.log('\nÚltimas notificaciones de sistema:');
      
      notifications.forEach((notification, index) => {
        console.log(`\n[${index + 1}] ID: ${notification.id}`);
        console.log(`Contenido: ${notification.content}`);
        console.log(`Tipo: ${notification.type}`);
        console.log(`Fecha: ${notification.createdAt}`);
        console.log(`Leída: ${notification.isRead ? 'Sí' : 'No'}`);
        console.log(`Para: ${notification.to ? `${notification.to.firstName} ${notification.to.lastName} (${notification.to.id})` : notification.toId}`);
        console.log(`De: ${notification.from ? `${notification.from.firstName} ${notification.from.lastName} (${notification.from.id})` : notification.fromId}`);
      });
    } else {
      console.log('No se encontraron notificaciones de sistema.');
    }
    
    // Obtener conteo de notificaciones por usuario
    const userNotificationCounts = await prisma.notification.groupBy({
      by: ['toId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log('\nConteo de notificaciones por usuario:');
    
    for (const count of userNotificationCounts) {
      const user = await prisma.user.findUnique({
        where: { id: count.toId },
        select: { firstName: true, lastName: true }
      });
      
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Usuario desconocido';
      console.log(`${userName} (${count.toId}): ${count._count.id} notificaciones`);
    }
    
  } catch (error) {
    console.error(`Error al verificar notificaciones: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función principal
main(); 