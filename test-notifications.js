const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log('Usuarios encontrados:', users.length);
    
    // Seleccionar un remitente (usaremos a Iván)
    const sender = users.find(u => u.firstName === 'Iván');
    
    if (!sender) {
      console.error('No se encontró al usuario remitente (Iván)');
      return;
    }
    
    console.log(`Remitente: ${sender.firstName} ${sender.lastName} (${sender.id})`);
    
    // Enviar una notificación a cada usuario (excepto al remitente)
    for (const user of users) {
      if (user.id === sender.id) continue;
      
      console.log(`Enviando notificación a: ${user.firstName} ${user.lastName} (${user.id})`);
      
      // Crear la notificación
      const notification = await prisma.notification.create({
        data: {
          type: 'MENSAJE',
          content: `Hola ${user.firstName}, esta es una notificación de prueba del sistema mejorado.`,
          from: { connect: { id: sender.id } },
          to: { connect: { id: user.id } },
          isRead: false
        },
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
      
      console.log(`Notificación creada: ${notification.id}`);
    }
    
    console.log('Proceso completado. Se han enviado notificaciones a todos los usuarios.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 