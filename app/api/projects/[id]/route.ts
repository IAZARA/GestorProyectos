import { NextResponse } from 'next/server';

// Importar el servicio de proyectos
const { projectService } = require('../../../../lib/db');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Obtener proyecto por ID
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener miembros del proyecto
    const members = await projectService.getProjectMembers(id);
    
    // Añadir miembros al proyecto
    project.members = members;
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return NextResponse.json(
      { error: 'Error al obtener el proyecto' },
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
    
    // Actualizar proyecto
    const updatedProject = await projectService.updateProject(id, data);
    
    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el proyecto' },
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
    
    // Eliminar proyecto
    await projectService.deleteProject(id);
    
    return NextResponse.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el proyecto' },
      { status: 500 }
    );
  }
} 