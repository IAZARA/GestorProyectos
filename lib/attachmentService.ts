import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Asegurarse de que el directorio de uploads exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
    // Generar un nombre de archivo único
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Guardar el archivo en el sistema de archivos
    fs.writeFileSync(filePath, file.buffer);

    // Guardar la información del archivo en la base de datos
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

    return attachment;
  } catch (error) {
    console.error('Error al guardar el archivo adjunto:', error);
    throw error;
  }
}

export async function getAttachmentById(id: string) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      throw new Error('Archivo adjunto no encontrado');
    }

    return attachment;
  } catch (error) {
    console.error('Error al obtener el archivo adjunto:', error);
    throw error;
  }
}

export async function getAttachmentsByProject(projectId: string) {
  try {
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

    return attachments;
  } catch (error) {
    console.error('Error al obtener los archivos adjuntos del proyecto:', error);
    throw error;
  }
}

export async function getAttachmentsByTask(taskId: string) {
  try {
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

    return attachments;
  } catch (error) {
    console.error('Error al obtener los archivos adjuntos de la tarea:', error);
    throw error;
  }
}

export async function deleteAttachment(id: string, userId: string) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      throw new Error('Archivo adjunto no encontrado');
    }

    // Verificar si el usuario tiene permiso para eliminar el archivo
    if (attachment.userId !== userId) {
      throw new Error('No tienes permiso para eliminar este archivo');
    }

    // Eliminar el archivo del sistema de archivos
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    // Eliminar el registro de la base de datos
    await prisma.attachment.delete({
      where: { id }
    });

    return true;
  } catch (error) {
    console.error('Error al eliminar el archivo adjunto:', error);
    throw error;
  }
} 