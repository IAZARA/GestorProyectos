/**
 * API endpoint para obtener y gestionar los miembros de un proyecto
 */

const { projectService, userService } = require('../../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de proyecto no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getProjectMembers(req, res, id);
    case 'POST':
      return await addProjectMember(req, res, id);
    case 'DELETE':
      return await removeProjectMember(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener miembros de un proyecto
 * GET /api/projects/:id/members
 */
async function getProjectMembers(req, res, id) {
  try {
    // Verificar si el proyecto existe
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Obtener miembros del proyecto
    const members = await projectService.getProjectMembers(id);
    
    return res.status(200).json(members);
  } catch (error) {
    console.error('Error al obtener miembros del proyecto:', error);
    return res.status(500).json({ message: 'Error al obtener miembros del proyecto', error: error.message });
  }
}

/**
 * Añadir un miembro a un proyecto
 * POST /api/projects/:id/members
 * Body: { user_id }
 */
async function addProjectMember(req, res, id) {
  try {
    const { user_id } = req.body;
    
    // Validar datos requeridos
    if (!user_id) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }
    
    // Verificar si el proyecto existe
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario existe
    const user = await userService.getUserById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el usuario ya es miembro del proyecto
    const members = await projectService.getProjectMembers(id);
    const isMember = members.some(member => member.id === user_id);
    
    if (isMember) {
      return res.status(409).json({ message: 'El usuario ya es miembro del proyecto' });
    }
    
    // Añadir miembro al proyecto
    await projectService.updateProject(id, {
      members: [...members.map(m => m.id), user_id]
    });
    
    return res.status(200).json({ message: 'Miembro añadido correctamente' });
  } catch (error) {
    console.error('Error al añadir miembro al proyecto:', error);
    return res.status(500).json({ message: 'Error al añadir miembro al proyecto', error: error.message });
  }
}

/**
 * Eliminar un miembro de un proyecto
 * DELETE /api/projects/:id/members?userId=<userId>
 */
async function removeProjectMember(req, res, id) {
  try {
    const { userId } = req.query;
    
    // Validar datos requeridos
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }
    
    // Verificar si el proyecto existe
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario es el creador del proyecto
    if (project.created_by === userId) {
      return res.status(400).json({ message: 'No se puede eliminar al creador del proyecto' });
    }
    
    // Obtener miembros del proyecto
    const members = await projectService.getProjectMembers(id);
    
    // Verificar si el usuario es miembro del proyecto
    const isMember = members.some(member => member.id === userId);
    
    if (!isMember) {
      return res.status(404).json({ message: 'El usuario no es miembro del proyecto' });
    }
    
    // Eliminar miembro del proyecto
    await projectService.updateProject(id, {
      members: members.filter(m => m.id !== userId).map(m => m.id)
    });
    
    return res.status(200).json({ message: 'Miembro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar miembro del proyecto:', error);
    return res.status(500).json({ message: 'Error al eliminar miembro del proyecto', error: error.message });
  }
} 