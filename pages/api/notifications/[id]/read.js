/**
 * API endpoint para marcar una notificación como leída
 */

const { notificationService } = require('../../../../lib/db');

export default async function handler(req, res) {
  // Solo permitir método PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de notificación no proporcionado' });
  }
  
  try {
    // Verificar si la notificación existe
    const existingNotification = await notificationService.getNotificationById(id);
    
    if (!existingNotification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    // Marcar como leída
    const [updatedNotification] = await notificationService.markNotificationAsRead(id);
    
    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return res.status(500).json({ message: 'Error al marcar notificación como leída', error: error.message });
  }
} 