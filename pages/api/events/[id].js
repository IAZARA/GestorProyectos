/**
 * API endpoint para obtener, actualizar y eliminar eventos por ID
 */

const { eventService, notificationService } = require('../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de evento no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getEventById(req, res, id);
    case 'PUT':
      return await updateEvent(req, res, id);
    case 'DELETE':
      return await deleteEvent(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener un evento por ID
 * GET /api/events/:id
 */
async function getEventById(req, res, id) {
  try {
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Obtener asistentes al evento
    const attendees = await eventService.getEventAttendees(id);
    
    // Devolver evento con asistentes
    return res.status(200).json({
      ...event,
      attendees
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return res.status(500).json({ message: 'Error al obtener evento', error: error.message });
  }
}

/**
 * Actualizar un evento
 * PUT /api/events/:id
 * Body: { title, description, start_date, end_date, project_id, type, color, attendees }
 */
async function updateEvent(req, res, id) {
  try {
    // Verificar si el evento existe
    const existingEvent = await eventService.getEventById(id);
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Actualizar evento
    const updatedData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Convertir fechas si se proporcionan
    if (updatedData.start_date) {
      updatedData.start_date = new Date(updatedData.start_date);
    }
    
    if (updatedData.end_date) {
      updatedData.end_date = new Date(updatedData.end_date);
    }
    
    const updatedEvent = await eventService.updateEvent(id, updatedData);
    
    // Crear notificaciones para nuevos asistentes
    if (updatedData.attendees && updatedData.attendees.length > 0) {
      // Obtener asistentes actuales
      const currentAttendees = await eventService.getEventAttendees(id);
      const currentAttendeeIds = currentAttendees.map(a => a.id);
      
      // Encontrar nuevos asistentes
      const newAttendees = updatedData.attendees.filter(
        attendeeId => !currentAttendeeIds.includes(attendeeId)
      );
      
      if (newAttendees.length > 0) {
        const projectText = existingEvent.project_id 
          ? ` al calendario del proyecto "${existingEvent.project_id}"` 
          : ' al calendario';
        
        for (const attendeeId of newAttendees) {
          // No enviar notificación al creador
          if (attendeeId !== existingEvent.created_by) {
            await notificationService.createNotification({
              id: uuidv4(),
              type: 'event_updated',
              content: `Has sido añadido al evento "${existingEvent.title}"${projectText}`,
              from_id: existingEvent.created_by,
              to_id: attendeeId,
              read: false,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
        }
      }
    }
    
    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
}

/**
 * Eliminar un evento
 * DELETE /api/events/:id
 */
async function deleteEvent(req, res, id) {
  try {
    // Verificar si el evento existe
    const existingEvent = await eventService.getEventById(id);
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Obtener asistentes al evento
    const attendees = await eventService.getEventAttendees(id);
    
    // Eliminar evento
    await eventService.deleteEvent(id);
    
    // Crear notificaciones para los asistentes
    for (const attendee of attendees) {
      // No enviar notificación al creador
      if (attendee.id !== existingEvent.created_by) {
        await notificationService.createNotification({
          id: uuidv4(),
          type: 'event_deleted',
          content: `El evento "${existingEvent.title}" ha sido eliminado`,
          from_id: existingEvent.created_by,
          to_id: attendee.id,
          read: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    return res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return res.status(500).json({ message: 'Error al eliminar evento', error: error.message });
  }
} 