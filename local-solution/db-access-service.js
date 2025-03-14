/**
 * Servicio centralizado para el acceso a la base de datos
 * Este servicio proporciona métodos para interactuar con la base de datos PostgreSQL
 * y garantiza la consistencia de los datos en toda la aplicación.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Clase para el servicio de base de datos
class DatabaseService {
  constructor() {
    this.prisma = prisma;
    this.isConnected = false;
    
    // Inicializar la conexión
    this.connect();
  }
  
  // Conectar a la base de datos
  async connect() {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('Conexión a la base de datos establecida correctamente');
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error);
      this.isConnected = false;
    }
  }
  
  // Desconectar de la base de datos
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('Desconexión de la base de datos realizada correctamente');
    } catch (error) {
      console.error('Error al desconectar de la base de datos:', error);
    }
  }
  
  // Verificar la conexión y reconectar si es necesario
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }
  
  // Métodos para usuarios
  
  /**
   * Obtener todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  async getAllUsers() {
    await this.ensureConnection();
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          expertise: true,
          photoUrl: true,
          password: true
        }
      });
      console.log(`Se encontraron ${users.length} usuarios en la base de datos`);
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  }
  
  /**
   * Obtener un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async getUserById(id) {
    await this.ensureConnection();
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          expertise: true,
          photoUrl: true,
          password: true
        }
      });
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Obtener un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  async getUserByEmail(email) {
    await this.ensureConnection();
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          expertise: true,
          photoUrl: true,
          password: true
        }
      });
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario con email ${email}:`, error);
      return null;
    }
  }
  
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object|null>} Usuario creado o null
   */
  async createUser(userData) {
    await this.ensureConnection();
    try {
      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          expertise: true,
          photoUrl: true,
          password: true
        }
      });
      console.log(`Usuario creado con ID: ${user.id}`);
      return user;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return null;
    }
  }
  
  /**
   * Actualizar un usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise<Object|null>} Usuario actualizado o null
   */
  async updateUser(id, userData) {
    await this.ensureConnection();
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          expertise: true,
          photoUrl: true,
          password: true
        }
      });
      console.log(`Usuario actualizado con ID: ${user.id}`);
      return user;
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Eliminar un usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<boolean>} true si se eliminó correctamente, false en caso contrario
   */
  async deleteUser(id) {
    await this.ensureConnection();
    try {
      await this.prisma.user.delete({
        where: { id }
      });
      console.log(`Usuario eliminado con ID: ${id}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error);
      return false;
    }
  }
  
  // Métodos para proyectos
  
  /**
   * Obtener todos los proyectos
   * @returns {Promise<Array>} Lista de proyectos
   */
  async getAllProjects() {
    await this.ensureConnection();
    try {
      const projects = await this.prisma.project.findMany({
        include: {
          tasks: true,
          assignedUsers: true
        }
      });
      console.log(`Se encontraron ${projects.length} proyectos en la base de datos`);
      return projects;
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      return [];
    }
  }
  
  /**
   * Obtener un proyecto por su ID
   * @param {string} id - ID del proyecto
   * @returns {Promise<Object|null>} Proyecto encontrado o null
   */
  async getProjectById(id) {
    await this.ensureConnection();
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          tasks: true,
          assignedUsers: true
        }
      });
      return project;
    } catch (error) {
      console.error(`Error al obtener proyecto con ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Crear un nuevo proyecto
   * @param {Object} projectData - Datos del proyecto
   * @returns {Promise<Object|null>} Proyecto creado o null
   */
  async createProject(projectData) {
    await this.ensureConnection();
    try {
      const project = await this.prisma.project.create({
        data: projectData,
        include: {
          tasks: true,
          assignedUsers: true
        }
      });
      console.log(`Proyecto creado con ID: ${project.id}`);
      return project;
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      return null;
    }
  }
  
  /**
   * Actualizar un proyecto existente
   * @param {string} id - ID del proyecto
   * @param {Object} projectData - Datos actualizados del proyecto
   * @returns {Promise<Object|null>} Proyecto actualizado o null
   */
  async updateProject(id, projectData) {
    await this.ensureConnection();
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: projectData,
        include: {
          tasks: true,
          assignedUsers: true
        }
      });
      console.log(`Proyecto actualizado con ID: ${project.id}`);
      return project;
    } catch (error) {
      console.error(`Error al actualizar proyecto con ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Eliminar un proyecto
   * @param {string} id - ID del proyecto
   * @returns {Promise<boolean>} true si se eliminó correctamente, false en caso contrario
   */
  async deleteProject(id) {
    await this.ensureConnection();
    try {
      await this.prisma.project.delete({
        where: { id }
      });
      console.log(`Proyecto eliminado con ID: ${id}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar proyecto con ID ${id}:`, error);
      return false;
    }
  }
  
  // Métodos para notificaciones
  
  /**
   * Obtener todas las notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de notificaciones
   */
  async getUserNotifications(userId) {
    await this.ensureConnection();
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`Se encontraron ${notifications.length} notificaciones para el usuario ${userId}`);
      return notifications;
    } catch (error) {
      console.error(`Error al obtener notificaciones para el usuario ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Crear una nueva notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object|null>} Notificación creada o null
   */
  async createNotification(notificationData) {
    await this.ensureConnection();
    try {
      const notification = await this.prisma.notification.create({
        data: notificationData
      });
      console.log(`Notificación creada con ID: ${notification.id}`);
      return notification;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return null;
    }
  }
  
  /**
   * Marcar una notificación como leída
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object|null>} Notificación actualizada o null
   */
  async markNotificationAsRead(id) {
    await this.ensureConnection();
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: { read: true }
      });
      console.log(`Notificación marcada como leída con ID: ${notification.id}`);
      return notification;
    } catch (error) {
      console.error(`Error al marcar notificación como leída con ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Eliminar una notificación
   * @param {string} id - ID de la notificación
   * @returns {Promise<boolean>} true si se eliminó correctamente, false en caso contrario
   */
  async deleteNotification(id) {
    await this.ensureConnection();
    try {
      await this.prisma.notification.delete({
        where: { id }
      });
      console.log(`Notificación eliminada con ID: ${id}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar notificación con ID ${id}:`, error);
      return false;
    }
  }
}

// Exportar una instancia única del servicio
const dbService = new DatabaseService();
module.exports = dbService; 