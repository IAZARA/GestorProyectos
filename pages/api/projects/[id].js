/**
 * API endpoint para obtener, actualizar y eliminar proyectos por ID
 */

const { projectService } = require('../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de proyecto no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getProjectById(req, res, id);
    case 'PUT':
      return await updateProject(req, res, id);
    case 'DELETE':
      return await deleteProject(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener un proyecto por ID
 * GET /api/projects/:id
 */
async function getProjectById(req, res, id) {
  try {
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Obtener miembros del proyecto
    const members = await projectService.getProjectMembers(id);
    
    // Devolver proyecto con miembros
    return res.status(200).json({
      ...project,
      members
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return res.status(500).json({ message: 'Error al obtener proyecto', error: error.message });
  }
}

/**
 * Actualizar un proyecto
 * PUT /api/projects/:id
 * Body: { name, description, members }
 */
async function updateProject(req, res, id) {
  try {
    // Verificar si el proyecto existe
    const existingProject = await projectService.getProjectById(id);
    
    if (!existingProject) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Actualizar proyecto
    const updatedData = {
      ...req.body,
      updated_at: new Date()
    };
    
    const updatedProject = await projectService.updateProject(id, updatedData);
    
    return res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    return res.status(500).json({ message: 'Error al actualizar proyecto', error: error.message });
  }
}

/**
 * Eliminar un proyecto
 * DELETE /api/projects/:id
 */
async function deleteProject(req, res, id) {
  try {
    // Verificar si el proyecto existe
    const existingProject = await projectService.getProjectById(id);
    
    if (!existingProject) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Eliminar proyecto
    await projectService.deleteProject(id);
    
    return res.status(200).json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
} 