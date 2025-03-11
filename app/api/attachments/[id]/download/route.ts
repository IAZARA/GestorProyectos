import { NextRequest, NextResponse } from 'next/server';
import { getAttachmentById } from '../../../../../lib/attachmentService';
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
    console.error('Error al descargar el archivo adjunto:', error);
    return NextResponse.json(
      { message: 'Error al descargar el archivo adjunto' },
      { status: 500 }
    );
  }
} 