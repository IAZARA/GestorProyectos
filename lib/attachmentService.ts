import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

// Usar la variable de entorno para el directorio de uploads o un valor predeterminado
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Asegurarse de que el directorio de uploads exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Directorio de uploads creado: ${UPLOAD_DIR}`);
}

export interface FileData {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export async function saveAttachment(
  file: FileData,
  userId: string,
  projectId?: string,
  taskId?: string
) {
  try {
    console.log(`Guardando archivo: ${file.originalname} (${file.size} bytes)`);
    
    // Generar un nombre de archivo único
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Guardar el archivo en el sistema de archivos
    fs.writeFileSync(filePath, file.buffer);
    console.log(`Archivo guardado en: ${filePath}`);

    // Guardar la información del archivo en la base de datos PostgreSQL
    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        userId,
        projectId,
        taskId
      }
    });

    console.log(`Attachment creado en la base de datos con ID: ${attachment.id}`);
    return attachment;
  } catch (error) {
    console.error('Error al guardar el archivo adjunto:', error);
    throw error;
  }
}

export async function getAttachmentById(id: string) {
  try {
    console.log(`Buscando attachment con ID: ${id}`);
    
    // Consultar directamente a la base de datos PostgreSQL
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      console.error(`Attachment no encontrado con ID: ${id}`);
      throw new Error('Archivo adjunto no encontrado');
    }

    console.log(`Attachment encontrado: ${attachment.originalName}`);
    return attachment;
  } catch (error) {
    console.error('Error al obtener el archivo adjunto:', error);
    throw error;
  }
}

export async function getAttachmentsByProject(projectId: string) {
  try {
    console.log(`Buscando attachments para el proyecto con ID: ${projectId}`);
    
    // Consultar directamente a la base de datos PostgreSQL
    const attachments = await prisma.attachment.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Se encontraron ${attachments.length} archivos adjuntos para el proyecto`);
    return attachments;
  } catch (error) {
    console.error('Error al obtener los archivos adjuntos del proyecto:', error);
    throw error;
  }
}

export async function getAttachmentsByTask(taskId: string) {
  try {
    console.log(`Buscando attachments para la tarea con ID: ${taskId}`);
    
    // Consultar directamente a la base de datos PostgreSQL
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Se encontraron ${attachments.length} archivos adjuntos para la tarea`);
    return attachments;
  } catch (error) {
    console.error('Error al obtener los archivos adjuntos de la tarea:', error);
    throw error;
  }
}

export async function deleteAttachment(id: string) {
  try {
    console.log(`Eliminando attachment con ID: ${id}`);
    
    // Obtener el attachment de la base de datos PostgreSQL
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      console.error(`Attachment no encontrado con ID: ${id}`);
      throw new Error('Archivo adjunto no encontrado');
    }

    // Intentar eliminar el archivo físico
    try {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
        console.log(`Archivo físico eliminado: ${attachment.path}`);
      } else {
        console.warn(`El archivo físico no existe: ${attachment.path}`);
      }
    } catch (fsError) {
      console.error('Error al eliminar el archivo físico:', fsError);
      // Continuamos con la eliminación del registro en la base de datos
    }

    // Eliminar el registro de la base de datos PostgreSQL
    await prisma.attachment.delete({
      where: { id }
    });

    console.log(`Attachment eliminado de la base de datos`);
    return true;
  } catch (error) {
    console.error('Error al eliminar el archivo adjunto:', error);
    throw error;
  }
}