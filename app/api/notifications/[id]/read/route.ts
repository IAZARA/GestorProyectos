import { NextResponse } from 'next/server';

// Importar el servicio de notificaciones
const { notificationService } = require('../../../../../lib/db');

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Marcar notificación como leída
    const updatedNotification = await notificationService.markNotificationAsRead(id);
    
    if (!updatedNotification || updatedNotification.length === 0) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedNotification[0]);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return NextResponse.json(
      { error: 'Error al marcar la notificación como leída' },
      { status: 500 }
    );
  }
} 