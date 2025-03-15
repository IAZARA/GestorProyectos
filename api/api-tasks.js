/**
 * API para gestionar tareas directamente de la base de datos PostgreSQL
 * Este archivo crea endpoints para gestionar tareas
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const prisma = new PrismaClient();
const router = express.Router();

// Middleware para parsear JSON
router.use(express.json());
router.use(cors());

/**
 * @route GET /api/tasks
 * @desc Obtener todas las tareas asignadas al usuario autenticado
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('Obteniendo tareas para el usuario:', req.user.id);
    
    // Obtener tareas asignadas al usuario
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: req.user.id
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Se encontraron ${tasks.length} tareas para el usuario.`);
    
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

/**
 * @route GET /api/tasks/:id
 * @desc Obtener una tarea por su ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la tarea existe
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              select: { id: true }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Verificar si el usuario tiene acceso a la tarea
    const userIsCreator = task.createdById === req.user.id;
    const userIsAssigned = task.assignedToId === req.user.id;
    const userIsProjectMember = task.project.members.some(member => member.id === req.user.id);
    
    if (!userIsCreator && !userIsAssigned && !userIsProjectMember) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta tarea' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
});

/**
 * @route POST /api/tasks
 * @desc Crear una nueva tarea
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, status, projectId, assignedToId } = req.body;
    
    // Validar datos requeridos
    if (!title || !description || !status || !projectId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    const userIsCreator = project.createdById === req.user.id;
    const userIsMember = project.members.some(member => member.id === req.user.id);
    
    if (!userIsCreator && !userIsMember) {
      return res.status(403).json({ error: 'No tienes permiso para crear tareas en este proyecto' });
    }
    
    // Si se especifica un usuario asignado, verificar que sea miembro del proyecto
    if (assignedToId) {
      const isMember = project.members.some(member => member.id === assignedToId);
      if (!isMember) {
        return res.status(400).json({ error: 'El usuario asignado debe ser miembro del proyecto' });
      }
    }
    
    // Crear la tarea
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        project: {
          connect: { id: projectId }
        },
        createdBy: {
          connect: { id: req.user.id }
        },
        assignedTo: assignedToId ? {
          connect: { id: assignedToId }
        } : undefined
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        }
      }
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

/**
 * @route PUT /api/tasks/:id
 * @desc Actualizar una tarea existente
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assignedToId } = req.body;
    
    // Verificar si la tarea existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Verificar si el usuario tiene permiso para actualizar la tarea
    const userIsCreator = existingTask.createdById === req.user.id;
    const userIsProjectCreator = existingTask.project.createdById === req.user.id;
    
    if (!userIsCreator && !userIsProjectCreator) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta tarea' });
    }
    
    // Si se especifica un usuario asignado, verificar que sea miembro del proyecto
    if (assignedToId) {
      const isMember = existingTask.project.members.some(member => member.id === assignedToId);
      if (!isMember) {
        return res.status(400).json({ error: 'El usuario asignado debe ser miembro del proyecto' });
      }
    }
    
    // Preparar datos para actualizar
    const updateData = {
      title,
      description,
      status,
      assignedTo: assignedToId ? {
        connect: { id: assignedToId }
      } : undefined
    };
    
    // Filtrar campos undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    // Actualizar la tarea
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        }
      }
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

/**
 * @route DELETE /api/tasks/:id
 * @desc Eliminar una tarea
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la tarea existe
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Verificar si el usuario tiene permiso para eliminar la tarea
    const userIsCreator = task.createdById === req.user.id;
    const userIsProjectCreator = task.project.createdById === req.user.id;
    
    if (!userIsCreator && !userIsProjectCreator) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea' });
    }
    
    // Eliminar la tarea
    await prisma.task.delete({
      where: { id }
    });
    
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
