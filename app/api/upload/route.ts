import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      );
    }
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }
    
    // Obtener la extensión del archivo
    const fileExtension = file.name.split('.').pop() || '';
    
    // Generar un nombre único para el archivo
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convertir el archivo a un ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Guardar el archivo en el servidor
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    // Devolver la URL del archivo
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
} 