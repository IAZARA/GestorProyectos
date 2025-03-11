import { NextRequest, NextResponse } from 'next/server';
import { saveAttachment, getAttachmentsByProject, getAttachmentsByTask } from '../../../lib/attachmentService';
import multer from 'multer';
import { Readable } from 'stream';
import { prisma } from '../../../lib/prisma';

// Configuración de multer para manejar la carga de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Función para convertir el buffer de la solicitud en un stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read es requerido pero no necesitamos implementarlo
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Función para procesar la carga de archivos con multer
async function runMiddleware(req: NextRequest, res: NextResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // Obtener el formulario directamente
    const formData = await req.formData();
    
    // Obtener los datos del formulario
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const projectId = formData.get('projectId') as string | undefined;
    const taskId = formData.get('taskId') as string | undefined;
    
    if (!file || !userId) {
      return NextResponse.json(
        { message: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }
    
    // Convertir el archivo a un formato que pueda ser procesado por el servicio
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);
    
    const fileData = {
      originalname: file.name,
      mimetype: file.type,
      buffer: fileBuffer,
      size: file.size
    };
    
    // Guardar el archivo
    const attachment = await saveAttachment(fileData, userId, projectId, taskId);
    
    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error al procesar la carga de archivos:', error);
    return NextResponse.json(
      { message: 'Error al procesar la carga de archivos' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    
    let attachments;
    
    if (projectId) {
      attachments = await getAttachmentsByProject(projectId);
    } else if (taskId) {
      attachments = await getAttachmentsByTask(taskId);
    } else {
      // Si no se proporciona ningún ID, devolver todos los archivos adjuntos
      attachments = await prisma.attachment.findMany({
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
    }
    
    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error al obtener los archivos adjuntos:', error);
    return NextResponse.json(
      { message: 'Error al obtener los archivos adjuntos' },
      { status: 500 }
    );
  }
} 