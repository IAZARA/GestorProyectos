/**
 * Rutas de API para proyectos
 * Este archivo contiene todas las rutas relacionadas con proyectos
 */

const express = require('express');
const router = express.Router();
const { projectService } = require('./lib/db');

// Obtener todos los proyectos o filtrar por usuario
router.get('/', async (req, res) => {
  try {
    // Obtener el ID del usuario del token JWT
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'Se requiere ID de usuario' });
    }
    
    console.log(`Obteniendo proyectos para el usuario: ${userId}`);
    
    // Obtener proyectos por usuario
    const projects = await projectService.getProjectsByUser(userId);
    
    // Obtener tareas, comentarios y archivos adjuntos para cada proyecto
    const projectsWithDetails = await Promise.all(projects.map(async (project) => {
      // Obtener tareas del proyecto
      const tasks = await projectService.getProjectTasks(project.id);
      
      // Obtener comentarios del proyecto
      const comments = await projectService.getProjectComments(project.id);
      
      // Obtener archivos adjuntos del proyecto
      const attachments = await projectService.getProjectAttachments(project.id);
      
      // Obtener miembros del proyecto
      const members = await projectService.getProjectMembers(project.id);
      
      return {
        ...project,
        tasks: tasks || [],
        comments: comments || [],
        attachments: attachments || [],
        members: members.map(member => member.id) || []
      };
    }));
    
    console.log(`Devolviendo ${projectsWithDetails.length} proyectos`);
    res.json(projectsWithDetails);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

// Obtener un proyecto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Obtener tareas del proyecto
    const tasks = await projectService.getProjectTasks(id);
    
    // Obtener comentarios del proyecto
    const comments = await projectService.getProjectComments(id);
    
    // Obtener archivos adjuntos del proyecto
    const attachments = await projectService.getProjectAttachments(id);
    
    // Obtener miembros del proyecto
    const members = await projectService.getProjectMembers(id);
    
    res.json({
      ...project,
      tasks: tasks || [],
      comments: comments || [],
      attachments: attachments || [],
      members: members.map(member => member.id) || []
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

// Crear un nuevo proyecto
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validar datos requeridos
    if (!projectData.name) {
      return res.status(400).json({ error: 'Falta el nombre del proyecto' });
    }
    
    // Asegurarse de que created_by esté presente
    if (!projectData.created_by) {
      // Usar el ID del usuario autenticado
      projectData.created_by = req.user.id;
    }
    
    // Extraer miembros antes de crear el proyecto
    const members = projectData.members || [projectData.created_by];
    
    // Crear proyecto sin incluir miembros en el objeto principal
    const project = {
      name: projectData.name,
      description: projectData.description || '',
      created_by: projectData.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creando proyecto con datos:', project, 'y miembros:', members);
    
    // Usar la transacción del servicio para crear el proyecto y sus miembros
    const result = await projectService.createProject({
      ...project,
      members
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
});

// Actualizar un proyecto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    // Verificar que el proyecto existe
    const existingProject = await projectService.getProjectById(id);
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Actualizar el proyecto
    const updatedProject = await projectService.updateProject(id, projectData);
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto' });
  }
});

// Eliminar un proyecto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el proyecto existe
    const existingProject = await projectService.getProjectById(id);
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Eliminar el proyecto
    await projectService.deleteProject(id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

module.exports = router;
