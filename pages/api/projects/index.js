/**
 * API endpoint para obtener y crear proyectos
 */

const { projectService } = require('../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getProjects(req, res);
    case 'POST':
      return await createProject(req, res);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener proyectos
 * GET /api/projects?userId=<userId>
 */
async function getProjects(req, res) {
  try {
    const { userId } = req.query;
    
    if (userId) {
      // Obtener proyectos por usuario
      const projects = await projectService.getProjectsByUser(userId);
      return res.status(200).json(projects);
    } else {
      // Obtener todos los proyectos
      const projects = await projectService.getAllProjects();
      return res.status(200).json(projects);
    }
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return res.status(500).json({ message: 'Error al obtener proyectos', error: error.message });
  }
}

/**
 * Crear un nuevo proyecto
 * POST /api/projects
 * Body: { name, description, created_by, members }
 */
async function createProject(req, res) {
  try {
    const { name, description, created_by, members } = req.body;
    
    // Validar datos requeridos
    if (!name || !created_by) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    // Crear proyecto
    const project = {
      id: uuidv4(),
      name,
      description,
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      members: members || [created_by] // Si no se proporcionan miembros, añadir al creador
    };
    
    const createdProject = await projectService.createProject(project);
    
    return res.status(201).json(createdProject);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
  }
} 