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
    // Extraer miembros antes de insertar el proyecto
    const members = projectData.members || [];
    
    // Eliminar miembros del objeto de proyecto
    const { members: _, ...projectToInsert } = projectData;
    
    console.log('Insertando proyecto:', projectToInsert);
    
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      try {
        // Insertar proyecto
        const [project] = await trx('projects').insert(projectToInsert).returning('*');
        
        console.log('Proyecto insertado:', project);
        
        // Insertar miembros del proyecto
        if (members.length > 0) {
          const memberInserts = members.map(userId => ({
            project_id: project.id,
            user_id: userId
          }));
          
          console.log('Insertando miembros:', memberInserts);
          
          await trx('project_members').insert(memberInserts);
        }
        
        return project;
      } catch (error) {
        console.error('Error en transacción de proyecto:', error);
        throw error;
      }
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
  },
  
  // Obtener tareas de un proyecto
  getProjectTasks: async (projectId) => {
    return await db('tasks')
      .where({ project_id: projectId })
      .select('*');
  },
  
  // Obtener comentarios de un proyecto
  getProjectComments: async (projectId) => {
    return await db('comments')
      .where({ project_id: projectId })
      .select('*');
  },
  
  // Obtener archivos adjuntos de un proyecto
  getProjectAttachments: async (projectId) => {
    return await db('attachments')
      .where({ project_id: projectId })
      .select('*');
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
    // Extraer asistentes antes de insertar el evento
    const attendees = eventData.attendees || [];
    
    // Eliminar asistentes del objeto de evento
    const { attendees: _, ...eventToInsert } = eventData;
    
    console.log('Insertando evento:', eventToInsert);
    
    // Iniciar transacción
    return await db.transaction(async (trx) => {
      try {
        // Insertar evento
        const [event] = await trx('events').insert(eventToInsert).returning('*');
        
        console.log('Evento insertado:', event);
        
        // Insertar asistentes al evento
        if (attendees.length > 0) {
          const attendeeInserts = attendees.map(userId => ({
            event_id: event.id,
            user_id: userId
          }));
          
          console.log('Insertando asistentes:', attendeeInserts);
          
          await trx('event_attendees').insert(attendeeInserts);
        }
        
        return event;
      } catch (error) {
        console.error('Error en transacción de evento:', error);
        throw error;
      }
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
    try {
      // Primero, intentar con campo is_read (prisma schema)
      const notifications = await db('notifications').where({ to_id: userId, is_read: false }).orderBy('created_at', 'desc');
      
      // Si no hay resultados, intentar con campo read (knex schema)
      if (notifications.length === 0) {
        return await db('notifications').where({ to_id: userId, read: false }).orderBy('created_at', 'desc');
      }
      
      return notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      // Fallback a read si ocurre error
      return await db('notifications').where({ to_id: userId, read: false }).orderBy('created_at', 'desc');
    }
  },
  
  // Crear una nueva notificación
  createNotification: async (notificationData) => {
    try {
      // Convertir campos si es necesario
      const normalizedData = {
        ...notificationData,
        // Asegurar que se use el campo correcto para marcar como no leída
        // Dependiendo de qué campos tenga la notificación
        is_read: false,
        read: false,
        // Asegurar formato correcto de fechas
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('Creando notificación con datos:', normalizedData);
      
      return await db('notifications').insert(normalizedData).returning('*');
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  },
  
  // Marcar una notificación como leída
  markNotificationAsRead: async (id) => {
    try {
      // Primero intentar con campo is_read (prisma schema)
      const result = await db('notifications').where({ id }).update({
        is_read: true,
        updated_at: new Date()
      }).returning('*');
      
      // Si no se actualizaron filas, intentar con campo read (knex schema)
      if (!result || result.length === 0) {
        return await db('notifications').where({ id }).update({
          read: true,
          updated_at: new Date()
        }).returning('*');
      }
      
      return result;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      // Fallback a read si ocurre error
      return await db('notifications').where({ id }).update({
        read: true,
        updated_at: new Date()
      }).returning('*');
    }
  },
  
  // Marcar todas las notificaciones de un usuario como leídas
  markAllNotificationsAsRead: async (userId) => {
    try {
      // Primero intentar con campo is_read (prisma schema)
      const isReadResult = await db('notifications').where({ to_id: userId, is_read: false }).update({
        is_read: true,
        updated_at: new Date()
      });
      
      // También intentar con campo read (knex schema)
      const readResult = await db('notifications').where({ to_id: userId, read: false }).update({
        read: true,
        updated_at: new Date()
      });
      
      return isReadResult + readResult; // Sumar la cantidad total de notificaciones actualizadas
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      // Fallback a read si ocurre error
      return await db('notifications').where({ to_id: userId, read: false }).update({
        read: true,
        updated_at: new Date()
      });
    }
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