import { NextResponse } from 'next/server';

// Importar el servicio de eventos
const { eventService } = require('../../../../lib/db');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Obtener evento por ID
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener asistentes al evento
    const attendees = await eventService.getEventAttendees(id);
    
    // Añadir asistentes al evento
    event.attendees = attendees;
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return NextResponse.json(
      { error: 'Error al obtener el evento' },
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
    
    // Actualizar evento
    const updatedEvent = await eventService.updateEvent(id, data);
    
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
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
    
    // Eliminar evento
    await eventService.deleteEvent(id);
    
    return NextResponse.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
} 