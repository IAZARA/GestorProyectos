/**
 * API endpoint para obtener y crear notificaciones
 */

const { notificationService } = require('../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getNotifications(req, res);
    case 'POST':
      return await createNotification(req, res);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener notificaciones
 * GET /api/notifications?userId=<userId>
 */
async function getNotifications(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      // Si no se proporciona userId, devolver todas las notificaciones
      const notifications = await notificationService.getAllNotifications();
      return res.status(200).json(notifications);
    }
    
    // Obtener notificaciones para un usuario específico
    const notifications = await notificationService.getNotificationsForUser(userId);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
  }
}

/**
 * Crear una nueva notificación
 * POST /api/notifications
 * Body: { type, content, from_id, to_id }
 */
async function createNotification(req, res) {
  try {
    const { type, content, from_id, to_id } = req.body;
    
    // Validar datos requeridos
    if (!type || !content || !from_id || !to_id) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    // Crear notificación
    const notification = {
      id: req.body.id || uuidv4(),
      type,
      content,
      from_id,
      to_id,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const [createdNotification] = await notificationService.createNotification(notification);
    
    return res.status(201).json(createdNotification);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return res.status(500).json({ message: 'Error al crear notificación', error: error.message });
  }
} 