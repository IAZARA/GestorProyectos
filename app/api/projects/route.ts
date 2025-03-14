import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Importar el servicio de proyectos
const { projectService } = require('../../../lib/db');

export async function POST(request: Request) {
  try {
    const projectData = await request.json();
    
    // Validar datos requeridos
    if (!projectData.name) {
      return NextResponse.json(
        { error: 'Falta el nombre del proyecto' },
        { status: 400 }
      );
    }
    
    // Asegurarse de que created_by esté presente
    if (!projectData.created_by) {
      // Usar un ID de usuario por defecto (Ivan)
      projectData.created_by = '857af152-2fd5-4a4b-a8cb-468fc2681f5c';
    }
    
    // Extraer miembros antes de crear el proyecto
    const members = projectData.members || [projectData.created_by];
    
    // Crear proyecto sin incluir miembros en el objeto principal
    const project = {
      id: uuidv4(),
      name: projectData.name,
      description: projectData.description || '',
      created_by: projectData.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creando proyecto con datos:', project, 'y miembros:', members);
    
    try {
      // Usar la transacción del servicio para crear el proyecto y sus miembros
      const result = await projectService.createProject({
        ...project,
        members
      });
      
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error('Error específico al crear proyecto:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear el proyecto' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let projects = [];
    
    if (userId) {
      // Obtener proyectos por usuario
      projects = await projectService.getProjectsByUser(userId);
    } else {
      // Obtener todos los proyectos
      projects = await projectService.getAllProjects();
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
} 