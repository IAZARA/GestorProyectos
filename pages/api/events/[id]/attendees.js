/**
 * API endpoint para obtener y gestionar los asistentes a un evento
 */

const { eventService, userService, notificationService } = require('../../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de evento no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getEventAttendees(req, res, id);
    case 'POST':
      return await addEventAttendee(req, res, id);
    case 'DELETE':
      return await removeEventAttendee(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener asistentes a un evento
 * GET /api/events/:id/attendees
 */
async function getEventAttendees(req, res, id) {
  try {
    // Verificar si el evento existe
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Obtener asistentes al evento
    const attendees = await eventService.getEventAttendees(id);
    
    return res.status(200).json(attendees);
  } catch (error) {
    console.error('Error al obtener asistentes al evento:', error);
    return res.status(500).json({ message: 'Error al obtener asistentes al evento', error: error.message });
  }
}

/**
 * Añadir un asistente a un evento
 * POST /api/events/:id/attendees
 * Body: { user_id }
 */
async function addEventAttendee(req, res, id) {
  try {
    const { user_id } = req.body;
    
    // Validar datos requeridos
    if (!user_id) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }
    
    // Verificar si el evento existe
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Verificar si el usuario existe
    const user = await userService.getUserById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el usuario ya es asistente al evento
    const attendees = await eventService.getEventAttendees(id);
    const isAttendee = attendees.some(attendee => attendee.id === user_id);
    
    if (isAttendee) {
      return res.status(409).json({ message: 'El usuario ya es asistente al evento' });
    }
    
    // Añadir asistente al evento
    await eventService.updateEvent(id, {
      attendees: [...attendees.map(a => a.id), user_id]
    });
    
    // Crear notificación para el usuario
    if (user_id !== event.created_by) {
      const projectText = event.project_id 
        ? ` al calendario del proyecto "${event.project_id}"` 
        : ' al calendario';
      
      await notificationService.createNotification({
        id: uuidv4(),
        type: 'event_attendee_added',
        content: `Has sido añadido al evento "${event.title}"${projectText}`,
        from_id: event.created_by,
        to_id: user_id,
        read: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    return res.status(200).json({ message: 'Asistente añadido correctamente' });
  } catch (error) {
    console.error('Error al añadir asistente al evento:', error);
    return res.status(500).json({ message: 'Error al añadir asistente al evento', error: error.message });
  }
}

/**
 * Eliminar un asistente de un evento
 * DELETE /api/events/:id/attendees?userId=<userId>
 */
async function removeEventAttendee(req, res, id) {
  try {
    const { userId } = req.query;
    
    // Validar datos requeridos
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }
    
    // Verificar si el evento existe
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Verificar si el usuario es el creador del evento
    if (event.created_by === userId) {
      return res.status(400).json({ message: 'No se puede eliminar al creador del evento como asistente' });
    }
    
    // Obtener asistentes al evento
    const attendees = await eventService.getEventAttendees(id);
    
    // Verificar si el usuario es asistente al evento
    const isAttendee = attendees.some(attendee => attendee.id === userId);
    
    if (!isAttendee) {
      return res.status(404).json({ message: 'El usuario no es asistente al evento' });
    }
    
    // Eliminar asistente del evento
    await eventService.updateEvent(id, {
      attendees: attendees.filter(a => a.id !== userId).map(a => a.id)
    });
    
    // Crear notificación para el usuario
    await notificationService.createNotification({
      id: uuidv4(),
      type: 'event_attendee_removed',
      content: `Has sido eliminado del evento "${event.title}"`,
      from_id: event.created_by,
      to_id: userId,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return res.status(200).json({ message: 'Asistente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar asistente del evento:', error);
    return res.status(500).json({ message: 'Error al eliminar asistente del evento', error: error.message });
  }
} 