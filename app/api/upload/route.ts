import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Inicializar Prisma
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el userId' },
        { status: 400 }
      );
    }
    
    // ProjectId es opcional para documentos administrativos
    console.log("Datos recibidos:", { 
      fileName: file.name, 
      userId, 
      projectId: projectId || "No proporcionado" 
    });
    
    // Obtener la extensión del archivo
    const fileExtension = file.name.split('.').pop() || '';
    
    // Generar un nombre único para el archivo
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convertir el archivo a un ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Definir el directorio de carga
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const absoluteUploadDir = join(process.cwd(), uploadDir);
    
    // Asegurarse de que el directorio exista
    if (!fs.existsSync(absoluteUploadDir)) {
      await mkdir(absoluteUploadDir, { recursive: true });
      console.log(`Directorio de carga creado: ${absoluteUploadDir}`);
    }
    
    // Guardar el archivo en el servidor
    const filePath = join(absoluteUploadDir, fileName);
    await writeFile(filePath, buffer);
    console.log(`Archivo guardado en: ${filePath}`);
    
    // Preparar los datos básicos
    let attachmentData = {
      fileName: fileName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      user: {
        connect: { id: userId }
      }
    };
    
    // Agregar el proyecto solo si se proporciona un projectId
    if (projectId) {
      attachmentData = {
        ...attachmentData,
        project: {
          connect: { id: projectId }
        }
      };
    }
    
    // Guardar la información del archivo en la base de datos PostgreSQL
    const attachment = await prisma.attachment.create({
      data: attachmentData
    });
    
    console.log(`Attachment guardado en la base de datos: ${JSON.stringify(attachment)}`);
    
    // Devolver la información del archivo
    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      path: attachment.path,
      url: `/api/attachments/${attachment.id}/download`
    });
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    return NextResponse.json(
      { error: 'Error al procesar el archivo', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}