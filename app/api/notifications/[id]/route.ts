import { NextResponse } from 'next/server';

// Importar el servicio de notificaciones
const { notificationService } = require('../../../../lib/db');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Obtener notificación por ID
    const notification = await notificationService.getNotificationById(id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    return NextResponse.json(
      { error: 'Error al obtener la notificación' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Actualizar notificación
    const updatedNotification = await notificationService.markNotificationAsRead(id);
    
    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedNotification[0]);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la notificación' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Eliminar notificación
    await notificationService.deleteNotification(id);
    
    return NextResponse.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
} 