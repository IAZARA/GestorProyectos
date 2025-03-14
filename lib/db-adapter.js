/**
 * Adaptador para compatibilidad entre Prisma y Knex.js
 * Este módulo proporciona funciones para adaptar los datos entre los dos sistemas
 */

const { prisma } = require('./prisma');
const { userService, projectService, eventService, notificationService } = require('./db');
const { v4: uuidv4 } = require('uuid');

// Adaptador para usuarios
const userAdapter = {
  // Convertir de formato Knex a Prisma
  toPrisma: (user) => {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role.toUpperCase(),
      expertise: user.expertise || 'Administrativo',
      password: user.password || '',
      photoUrl: user.photo_url || ''
    };
  },
  
  // Convertir de formato Prisma a Knex
  toKnex: (user) => {
    return {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      role: user.role.toLowerCase(),
      expertise: user.expertise,
      photo_url: user.photoUrl,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  },
  
  // Crear un usuario usando Knex
  createUser: async (userData) => {
    // Generar ID si no se proporciona
    if (!userData.id) {
      userData.id = uuidv4();
    }
    
    // Asegurarse de que first_name y last_name no sean nulos
    const first_name = userData.firstName || userData.first_name || 'Usuario';
    const last_name = userData.lastName || userData.last_name || 'Sin Apellido';
    
    // Convertir a formato Knex
    const knexUser = {
      id: userData.id,
      first_name: first_name,
      last_name: last_name,
      email: userData.email,
      role: userData.role || 'user',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creando usuario con datos:', knexUser);
    
    // Crear usuario en la base de datos
    const result = await userService.createUser(knexUser);
    return result[0];
  }
};

// Adaptador para proyectos
const projectAdapter = {
  // Convertir de formato Knex a Prisma
  toPrisma: (project) => {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: 'En_Progreso',
      startDate: project.created_at,
      endDate: null,
      createdById: project.created_by
    };
  },
  
  // Convertir de formato Prisma a Knex
  toKnex: (project) => {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      created_by: project.createdById,
      created_at: project.createdAt || project.startDate,
      updated_at: project.updatedAt || new Date()
    };
  },
  
  // Crear un proyecto usando Knex
  createProject: async (projectData) => {
    // Generar ID si no se proporciona
    if (!projectData.id) {
      projectData.id = uuidv4();
    }
    
    // Convertir a formato Knex
    const knexProject = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || '',
      created_by: projectData.createdById || projectData.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Extraer miembros
    const members = projectData.members || [knexProject.created_by];
    
    console.log('Creando proyecto con datos:', knexProject, 'y miembros:', members);
    
    // Crear proyecto en la base de datos
    const result = await projectService.createProject({
      ...knexProject,
      members
    });
    
    return result;
  }
};

// Adaptador para eventos
const eventAdapter = {
  // Convertir de formato Knex a Prisma
  toPrisma: (event) => {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      type: event.type,
      color: event.color,
      createdById: event.created_by,
      projectId: event.project_id
    };
  },
  
  // Convertir de formato Prisma a Knex
  toKnex: (event) => {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.startDate,
      end_date: event.endDate,
      type: event.type,
      color: event.color,
      created_by: event.createdById,
      project_id: event.projectId,
      created_at: event.createdAt || new Date(),
      updated_at: event.updatedAt || new Date()
    };
  },
  
  // Crear un evento usando Knex
  createEvent: async (eventData) => {
    // Generar ID si no se proporciona
    if (!eventData.id) {
      eventData.id = uuidv4();
    }
    
    // Convertir a formato Knex
    const knexEvent = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description || '',
      start_date: eventData.startDate || eventData.start_date,
      end_date: eventData.endDate || eventData.end_date,
      type: eventData.type || 'meeting',
      color: eventData.color || '#3498db',
      created_by: eventData.createdById || eventData.created_by,
      project_id: eventData.projectId || eventData.project_id,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Extraer asistentes
    const attendees = eventData.attendees || [knexEvent.created_by];
    
    console.log('Creando evento con datos:', knexEvent, 'y asistentes:', attendees);
    
    // Crear evento en la base de datos
    const result = await eventService.createEvent({
      ...knexEvent,
      attendees
    });
    
    return result;
  }
};

module.exports = {
  userAdapter,
  projectAdapter,
  eventAdapter
}; 