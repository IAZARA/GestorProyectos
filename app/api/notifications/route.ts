import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Importar el servicio de notificaciones
const { notificationService } = require('../../../lib/db');

export async function POST(request: Request) {
  try {
    const notificationData = await request.json();
    
    // Validar datos requeridos
    if (!notificationData.type || !notificationData.content || !notificationData.to_id) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (tipo, contenido o destinatario)' },
        { status: 400 }
      );
    }
    
    // Crear notificación
    const newNotification = await notificationService.createNotification(notificationData);
    
    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return NextResponse.json(
      { error: 'Error al crear la notificación' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    let notifications = [];
    
    if (userId) {
      if (unreadOnly) {
        // Obtener notificaciones no leídas para un usuario
        notifications = await notificationService.getUnreadNotificationsForUser(userId);
      } else {
        // Obtener todas las notificaciones para un usuario
        notifications = await notificationService.getNotificationsForUser(userId);
      }
    } else {
      // Obtener todas las notificaciones
      notifications = await notificationService.getAllNotifications();
    }
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
} 