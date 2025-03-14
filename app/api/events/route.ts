import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Importar el servicio de eventos
const { eventService } = require('../../../lib/db');

export async function POST(request: Request) {
  try {
    const eventData = await request.json();
    
    // Validar datos requeridos
    if (!eventData.title) {
      return NextResponse.json(
        { error: 'Falta el título del evento' },
        { status: 400 }
      );
    }
    
    // Asegurarse de que las fechas estén presentes
    const startDate = eventData.startDate || eventData.start_date || new Date();
    const endDate = eventData.endDate || eventData.end_date || new Date(startDate);
    
    // Si la fecha de fin es anterior a la de inicio, añadir 1 hora
    if (new Date(endDate) <= new Date(startDate)) {
      endDate.setHours(endDate.getHours() + 1);
    }
    
    // Asegurarse de que created_by esté presente
    const createdBy = eventData.createdById || eventData.created_by || '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
    
    // Extraer asistentes antes de crear el evento
    const attendees = eventData.attendees || [createdBy];
    
    // Crear evento sin incluir asistentes en el objeto principal
    const event = {
      id: uuidv4(),
      title: eventData.title,
      description: eventData.description || '',
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      type: eventData.type || 'meeting',
      color: eventData.color || '#3498db',
      created_by: createdBy,
      project_id: eventData.projectId || eventData.project_id,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creando evento con datos:', event, 'y asistentes:', attendees);
    
    try {
      // Usar la transacción del servicio para crear el evento y sus asistentes
      const result = await eventService.createEvent({
        ...event,
        attendees
      });
      
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error('Error específico al crear evento:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { error: 'Error al crear el evento' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    
    let events = [];
    
    if (userId) {
      // Eventos donde el usuario es creador o asistente
      events = await eventService.getEventsByUser(userId);
    } else if (projectId) {
      // Eventos de un proyecto específico
      events = await eventService.getEventsByProject(projectId);
    } else {
      // Todos los eventos
      events = await eventService.getAllEvents();
    }
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
} 