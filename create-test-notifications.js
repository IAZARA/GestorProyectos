/**
 * Script para crear notificaciones de prueba en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    console.log('Creando notificaciones de prueba...');
    
    // Obtener usuarios para crear notificaciones entre ellos
    const users = await prisma.user.findMany();
    
    if (users.length < 2) {
      console.error('Se necesitan al menos 2 usuarios para crear notificaciones de prueba');
      return;
    }
    
    console.log(`Se encontraron ${users.length} usuarios`);
    
    // Tipos de notificaciones para pruebas
    const notificationTypes = [
      'task_assigned',
      'comment_added',
      'project_updated',
      'wiki_edited',
      'project_added',
      'event_added',
      'document_uploaded'
    ];
    
    // Contenido de ejemplo para cada tipo de notificación
    const contentTemplates = {
      'task_assigned': 'Te han asignado una nueva tarea: "Revisar documentación"',
      'comment_added': 'Han comentado en un proyecto donde participas',
      'project_updated': 'El proyecto "Gestión de Documentos" ha sido actualizado',
      'wiki_edited': 'La wiki del proyecto ha sido editada',
      'project_added': 'Has sido añadido al proyecto "Nuevo Sistema"',
      'event_added': 'Nuevo evento: "Reunión de seguimiento" programado para mañana',
      'document_uploaded': 'Se ha subido un nuevo documento: "Informe Mensual.pdf"'
    };
    
    // Crear notificaciones para cada usuario
    const createdNotifications = [];
    
    for (let i = 0; i < users.length; i++) {
      const recipient = users[i];
      const sender = users[(i + 1) % users.length]; // Usar el siguiente usuario como remitente
      
      // Crear 3 notificaciones para cada usuario
      for (let j = 0; j < 3; j++) {
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const content = contentTemplates[type];
        
        const notification = await prisma.notification.create({
          data: {
            type,
            content,
            isRead: false,
            to: { connect: { id: recipient.id } },
            from: { connect: { id: sender.id } }
          }
        });
        
        createdNotifications.push(notification);
        console.log(`Notificación creada: ${notification.id} - De: ${sender.firstName} ${sender.lastName} - Para: ${recipient.firstName} ${recipient.lastName}`);
      }
    }
    
    console.log(`Se crearon ${createdNotifications.length} notificaciones de prueba`);
  } catch (error) {
    console.error('Error al crear notificaciones de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createTestNotifications();
