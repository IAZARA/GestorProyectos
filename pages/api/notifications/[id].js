/**
 * API endpoint para obtener, actualizar y eliminar notificaciones por ID
 */

const { notificationService } = require('../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de notificación no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getNotificationById(req, res, id);
    case 'PUT':
      return await updateNotification(req, res, id);
    case 'DELETE':
      return await deleteNotification(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener una notificación por ID
 * GET /api/notifications/:id
 */
async function getNotificationById(req, res, id) {
  try {
    const notification = await notificationService.getNotificationById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    return res.status(500).json({ message: 'Error al obtener notificación', error: error.message });
  }
}

/**
 * Actualizar una notificación
 * PUT /api/notifications/:id
 * Body: { type, content, from_id, to_id, read }
 */
async function updateNotification(req, res, id) {
  try {
    // Verificar si la notificación existe
    const existingNotification = await notificationService.getNotificationById(id);
    
    if (!existingNotification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    // Actualizar notificación
    const updatedData = {
      ...req.body,
      updated_at: new Date()
    };
    
    const [updatedNotification] = await notificationService.updateNotification(id, updatedData);
    
    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    return res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
  }
}

/**
 * Eliminar una notificación
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res, id) {
  try {
    // Verificar si la notificación existe
    const existingNotification = await notificationService.getNotificationById(id);
    
    if (!existingNotification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    // Eliminar notificación
    await notificationService.deleteNotification(id);
    
    return res.status(200).json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return res.status(500).json({ message: 'Error al eliminar notificación', error: error.message });
  }
} 