import { NextRequest, NextResponse } from 'next/server';
import { getAttachmentById, deleteAttachment } from '../../../../lib/attachmentService';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachment = await getAttachmentById(params.id);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(attachment.path)) {
      return NextResponse.json(
        { message: 'Archivo no encontrado' },
        { status: 404 }
      );
    }
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(attachment.path);
    
    // Crear una respuesta con el archivo
    const response = new NextResponse(fileBuffer);
    
    // Establecer los encabezados adecuados
    response.headers.set('Content-Type', attachment.mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    return response;
  } catch (error) {
    console.error('Error al obtener el archivo adjunto:', error);
    return NextResponse.json(
      { message: 'Error al obtener el archivo adjunto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID del usuario de la sesión o de la solicitud
    // En una aplicación real, esto vendría de la sesión autenticada
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }
    
    await deleteAttachment(params.id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar el archivo adjunto:', error);
    
    if (error instanceof Error && error.message.includes('No tienes permiso')) {
      return NextResponse.json(
        { message: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { message: 'Error al eliminar el archivo adjunto' },
      { status: 500 }
    );
  }
} 