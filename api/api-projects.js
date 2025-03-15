/**
 * API para gestionar proyectos directamente de la base de datos PostgreSQL
 * Este archivo crea endpoints para gestionar proyectos
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
 * @route GET /api/projects
 * @desc Obtener todos los proyectos del usuario autenticado
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('Obteniendo proyectos para el usuario:', req.user.id);
    
    // Obtener proyectos donde el usuario es creador o miembro
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { createdById: req.user.id },
          { members: { some: { id: req.user.id } } }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photoUrl: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Se encontraron ${projects.length} proyectos para el usuario.`);
    
    res.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

/**
 * @route GET /api/projects/:id
 * @desc Obtener un proyecto por su ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photoUrl: true
              }
            }
          }
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
      return res.status(403).json({ error: 'No tienes permiso para ver este proyecto' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

/**
 * @route POST /api/projects
 * @desc Crear un nuevo proyecto
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, members } = req.body;
    
    // Validar datos requeridos
    if (!name || !description || !status || !startDate) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Crear el proyecto
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        createdBy: {
          connect: { id: req.user.id }
        },
        members: {
          connect: members ? members.map(id => ({ id })) : []
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
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
    
    // Conectar al creador como miembro si no está incluido
    if (!members || !members.includes(req.user.id)) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          members: {
            connect: { id: req.user.id }
          }
        }
      });
    }
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

/**
 * @route PUT /api/projects/:id
 * @desc Actualizar un proyecto existente
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, endDate, members } = req.body;
    
    // Verificar si el proyecto existe
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true }
        }
      }
    });
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario es el creador del proyecto
    if (existingProject.createdById !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este proyecto' });
    }
    
    // Preparar datos para actualizar
    const updateData = {
      name,
      description,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : null
    };
    
    // Filtrar campos undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    // Actualizar miembros si se proporcionan
    if (members) {
      // Obtener IDs de miembros actuales
      const currentMemberIds = existingProject.members.map(member => member.id);
      
      // Determinar miembros a agregar y eliminar
      const membersToAdd = members.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !members.includes(id) && id !== req.user.id);
      
      // Agregar nuevos miembros
      if (membersToAdd.length > 0) {
        updateData.members = {
          connect: membersToAdd.map(id => ({ id }))
        };
      }
      
      // Eliminar miembros (excepto el creador)
      if (membersToRemove.length > 0) {
        if (!updateData.members) {
          updateData.members = {};
        }
        updateData.members.disconnect = membersToRemove.map(id => ({ id }));
      }
    }
    
    // Actualizar el proyecto
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photoUrl: true
              }
            }
          }
        }
      }
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

/**
 * @route DELETE /api/projects/:id
 * @desc Eliminar un proyecto
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario es el creador del proyecto
    if (project.createdById !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este proyecto' });
    }
    
    // Eliminar el proyecto
    await prisma.project.delete({
      where: { id }
    });
    
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

/**
 * @route GET /api/projects/:id/tasks
 * @desc Obtener todas las tareas de un proyecto
 * @access Private
 */
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id },
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
      return res.status(403).json({ error: 'No tienes permiso para ver las tareas de este proyecto' });
    }
    
    // Obtener tareas del proyecto
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas del proyecto:', error);
    res.status(500).json({ error: 'Error al obtener tareas del proyecto' });
  }
});

/**
 * @route POST /api/projects/:id/members
 * @desc Agregar miembros a un proyecto
 * @access Private
 */
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Se requiere un array de IDs de miembros' });
    }
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario es el creador del proyecto
    if (project.createdById !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este proyecto' });
    }
    
    // Agregar los miembros al proyecto
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          connect: members.map(memberId => ({ id: memberId }))
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
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
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error al agregar miembros al proyecto:', error);
    res.status(500).json({ error: 'Error al agregar miembros al proyecto' });
  }
});

/**
 * @route DELETE /api/projects/:id/members
 * @desc Eliminar miembros de un proyecto
 * @access Private
 */
router.delete('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Se requiere un array de IDs de miembros' });
    }
    
    // Verificar si el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario es el creador del proyecto
    if (project.createdById !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este proyecto' });
    }
    
    // No permitir eliminar al creador del proyecto
    if (members.includes(project.createdById)) {
      return res.status(400).json({ error: 'No se puede eliminar al creador del proyecto' });
    }
    
    // Eliminar los miembros del proyecto
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          disconnect: members.map(memberId => ({ id: memberId }))
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true
          }
        },
        members: {
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
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error al eliminar miembros del proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar miembros del proyecto' });
  }
});

module.exports = router;
