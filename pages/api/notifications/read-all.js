/**
 * API endpoint para marcar todas las notificaciones de un usuario como leídas
 */

const { notificationService } = require('../../../lib/db');

export default async function handler(req, res) {
  // Solo permitir método PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'ID de usuario no proporcionado' });
  }
  
  try {
    // Marcar todas las notificaciones del usuario como leídas
    const result = await notificationService.markAllNotificationsAsRead(userId);
    
    return res.status(200).json({ 
      message: 'Todas las notificaciones marcadas como leídas',
      count: result
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({ 
      message: 'Error al marcar todas las notificaciones como leídas', 
      error: error.message 
    });
  }
} 