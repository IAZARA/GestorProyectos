/**
 * Servicio de base de datos para la aplicación
 * Este módulo proporciona funciones para interactuar con la base de datos PostgreSQL
 */

const knex = require('knex');
const dbConfig = require('../config/database');

// Crear una instancia de conexión a la base de datos
const db = knex(dbConfig);

// Funciones para usuarios
const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    return await db('users').select('*');
  },
  
  // Obtener un usuario por ID
  getUserById: async (id) => {
    return await db('users').where({ id }).first();
  },
  
  // Obtener un usuario por email
  getUserByEmail: async (email) => {
    return await db('users').where({ email }).first();
  },
  
  // Crear un nuevo usuario
  createUser: async (userData) => {
    return await db('users').insert(userData).returning('*');
  },
  
  // Actualizar un usuario
  updateUser: async (id, userData) => {
    return await db('users').where({ id }).update({
      ...userData,
      updated_at: new Date()
    }).returning('*');
  },
  
  // Eliminar un usuario
  deleteUser: async (id) => {
    return await db('users').where({ id }).del();
  }
};

// Funciones para proyectos
const projectService = {
  // Obtener todos los proyectos
  getAllProjects: async () => {
    return await db('projects').select('*');
  },
  
  // Obtener un proyecto por ID
  getProjectById: async (id) => {
    return await db('projects').where({ id }).first();
  },
  
  // Obtener proyectos por usuario
  getProjectsByUser: async (userId) => {
    return await db('projects')
      .join('project_members', 'projects.id', 'project_members.project_id')
      .where('project_members.user_id', userId)
      .select('projects.*');
  },
  
  // Crear un nuevo proyecto
  createProject: async (projectData) => {
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      // Insertar proyecto
      const [project] = await trx('projects').insert(projectData).returning('*');
      
      // Insertar miembros del proyecto
      if (projectData.members && Array.isArray(projectData.members)) {
        const memberInserts = projectData.members.map(userId => ({
          project_id: project.id,
          user_id: userId
        }));
        
        await trx('project_members').insert(memberInserts);
      }
      
      return project;
    });
  },
  
  // Actualizar un proyecto
  updateProject: async (id, projectData) => {
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      // Actualizar proyecto
      const [project] = await trx('projects').where({ id }).update({
        name: projectData.name,
        description: projectData.description,
        updated_at: new Date()
      }).returning('*');
      
      // Actualizar miembros del proyecto si se proporcionan
      if (projectData.members && Array.isArray(projectData.members)) {
        // Eliminar miembros actuales
        await trx('project_members').where({ project_id: id }).del();
        
        // Insertar nuevos miembros
        const memberInserts = projectData.members.map(userId => ({
          project_id: id,
          user_id: userId
        }));
        
        await trx('project_members').insert(memberInserts);
      }
      
      return project;
    });
  },
  
  // Eliminar un proyecto
  deleteProject: async (id) => {
    return await db('projects').where({ id }).del();
  },
  
  // Obtener miembros de un proyecto
  getProjectMembers: async (projectId) => {
    return await db('users')
      .join('project_members', 'users.id', 'project_members.user_id')
      .where('project_members.project_id', projectId)
      .select('users.*');
  }
};

// Funciones para eventos
const eventService = {
  // Obtener todos los eventos
  getAllEvents: async () => {
    return await db('events').select('*');
  },
  
  // Obtener un evento por ID
  getEventById: async (id) => {
    return await db('events').where({ id }).first();
  },
  
  // Obtener eventos por proyecto
  getEventsByProject: async (projectId) => {
    return await db('events').where({ project_id: projectId }).select('*');
  },
  
  // Obtener eventos por usuario
  getEventsByUser: async (userId) => {
    // Eventos creados por el usuario o donde el usuario es asistente
    return await db('events')
      .leftJoin('event_attendees', 'events.id', 'event_attendees.event_id')
      .where('events.created_by', userId)
      .orWhere('event_attendees.user_id', userId)
      .distinct('events.*');
  },
  
  // Crear un nuevo evento
  createEvent: async (eventData) => {
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      // Insertar evento
      const [event] = await trx('events').insert(eventData).returning('*');
      
      // Insertar asistentes al evento
      if (eventData.attendees && Array.isArray(eventData.attendees)) {
        const attendeeInserts = eventData.attendees.map(userId => ({
          event_id: event.id,
          user_id: userId
        }));
        
        await trx('event_attendees').insert(attendeeInserts);
      }
      
      return event;
    });
  },
  
  // Actualizar un evento
  updateEvent: async (id, eventData) => {
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      // Actualizar evento
      const [event] = await trx('events').where({ id }).update({
        ...eventData,
        updated_at: new Date()
      }).returning('*');
      
      // Actualizar asistentes al evento si se proporcionan
      if (eventData.attendees && Array.isArray(eventData.attendees)) {
        // Eliminar asistentes actuales
        await trx('event_attendees').where({ event_id: id }).del();
        
        // Insertar nuevos asistentes
        const attendeeInserts = eventData.attendees.map(userId => ({
          event_id: id,
          user_id: userId
        }));
        
        await trx('event_attendees').insert(attendeeInserts);
      }
      
      return event;
    });
  },
  
  // Eliminar un evento
  deleteEvent: async (id) => {
    return await db('events').where({ id }).del();
  },
  
  // Obtener asistentes a un evento
  getEventAttendees: async (eventId) => {
    return await db('users')
      .join('event_attendees', 'users.id', 'event_attendees.user_id')
      .where('event_attendees.event_id', eventId)
      .select('users.*');
  }
};

// Funciones para notificaciones
const notificationService = {
  // Obtener todas las notificaciones
  getAllNotifications: async () => {
    return await db('notifications').select('*');
  },
  
  // Obtener una notificación por ID
  getNotificationById: async (id) => {
    return await db('notifications').where({ id }).first();
  },
  
  // Obtener notificaciones para un usuario
  getNotificationsForUser: async (userId) => {
    return await db('notifications').where({ to_id: userId }).orderBy('created_at', 'desc');
  },
  
  // Obtener notificaciones no leídas para un usuario
  getUnreadNotificationsForUser: async (userId) => {
    return await db('notifications').where({ to_id: userId, read: false }).orderBy('created_at', 'desc');
  },
  
  // Crear una nueva notificación
  createNotification: async (notificationData) => {
    return await db('notifications').insert(notificationData).returning('*');
  },
  
  // Marcar una notificación como leída
  markNotificationAsRead: async (id) => {
    return await db('notifications').where({ id }).update({
      read: true,
      updated_at: new Date()
    }).returning('*');
  },
  
  // Marcar todas las notificaciones de un usuario como leídas
  markAllNotificationsAsRead: async (userId) => {
    return await db('notifications').where({ to_id: userId, read: false }).update({
      read: true,
      updated_at: new Date()
    });
  },
  
  // Eliminar una notificación
  deleteNotification: async (id) => {
    return await db('notifications').where({ id }).del();
  }
};

// Exportar servicios
module.exports = {
  db,
  userService,
  projectService,
  eventService,
  notificationService,
  
  // Función para cerrar la conexión a la base de datos
  closeConnection: async () => {
    await db.destroy();
  }
}; 