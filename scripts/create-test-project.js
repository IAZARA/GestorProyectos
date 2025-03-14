/**
 * Script para crear un proyecto de prueba directamente en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestProject() {
  try {
    // ID de usuario de Iván Zarate (o el usuario que estés usando)
    const userId = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
    
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.error('Usuario no encontrado con ID:', userId);
      return;
    }
    
    console.log('Usuario encontrado:', user.email);
    
    // Datos del proyecto
    const projectId = uuidv4();
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Fecha de fin 3 meses después
    
    console.log('Creando proyecto con ID:', projectId);
    
    // Crear el proyecto con relaciones
    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: 'Proyecto de Prueba',
        description: 'Este es un proyecto de prueba creado directamente en la base de datos',
        status: 'En_Progreso', // Valor correcto del enum ProjectStatus
        startDate: now,
        endDate: endDate,
        createdBy: {
          connect: { id: userId }
        },
        members: {
          connect: [{ id: userId }]
        }
      },
      include: {
        createdBy: true,
        members: true
      }
    });
    
    console.log('Proyecto creado:', project);
    
    // Crear una tarea para el proyecto
    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        title: 'Tarea de prueba',
        description: 'Esta es una tarea de prueba para el proyecto',
        status: 'Por_Hacer', // Valor correcto del enum TaskStatus
        project: {
          connect: { id: projectId }
        },
        assignedTo: {
          connect: { id: userId }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    });
    
    console.log('Tarea creada:', task);
    
    console.log('Proyecto de prueba creado exitosamente');
  } catch (error) {
    console.error('Error al crear el proyecto de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProject();
