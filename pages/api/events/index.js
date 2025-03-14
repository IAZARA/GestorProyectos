/**
 * API endpoint para obtener y crear eventos
 */

const { eventService, notificationService } = require('../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getEvents(req, res);
    case 'POST':
      return await createEvent(req, res);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener eventos
 * GET /api/events?userId=<userId>&projectId=<projectId>
 */
async function getEvents(req, res) {
  try {
    const { userId, projectId } = req.query;
    
    if (userId) {
      // Obtener eventos por usuario
      const events = await eventService.getEventsByUser(userId);
      return res.status(200).json(events);
    } else if (projectId) {
      // Obtener eventos por proyecto
      const events = await eventService.getEventsByProject(projectId);
      return res.status(200).json(events);
    } else {
      // Obtener todos los eventos
      const events = await eventService.getAllEvents();
      return res.status(200).json(events);
    }
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
}

/**
 * Crear un nuevo evento
 * POST /api/events
 * Body: { title, description, start_date, end_date, created_by, project_id, type, color, attendees }
 */
async function createEvent(req, res) {
  try {
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      created_by, 
      project_id, 
      type, 
      color, 
      attendees 
    } = req.body;
    
    // Validar datos requeridos
    if (!title || !start_date || !end_date || !created_by || !type) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    // Crear evento
    const event = {
      id: uuidv4(),
      title,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      created_by,
      project_id,
      type,
      color,
      created_at: new Date(),
      updated_at: new Date(),
      attendees: attendees || [created_by] // Si no se proporcionan asistentes, añadir al creador
    };
    
    const createdEvent = await eventService.createEvent(event);
    
    // Crear notificaciones para los asistentes
    if (attendees && attendees.length > 0) {
      const projectText = project_id ? ` al calendario del proyecto "${project_id}"` : ' al calendario';
      
      for (const attendeeId of attendees) {
        // No enviar notificación al creador
        if (attendeeId !== created_by) {
          await notificationService.createNotification({
            id: uuidv4(),
            type: 'event_added',
            content: `Se ha añadido un evento "${title}"${projectText}`,
            from_id: created_by,
            to_id: attendeeId,
            read: false,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }
    
    return res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error al crear evento:', error);
    return res.status(500).json({ message: 'Error al crear evento', error: error.message });
  }
} 