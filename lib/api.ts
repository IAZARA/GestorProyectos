/**
 * Archivo centralizado para manejar todas las llamadas a la API
 */

const API_BASE_URL = 'http://localhost:3005';

import { User, Role, Expertise } from '../types/user';

// Asegurarnos de que LoginResponse sea compatible con User
interface LoginResponse extends Omit<User, 'password' | 'especialidad'> {
  token: string;
}

/**
 * Obtiene el token de autenticación del localStorage
 * @returns {string|null} El token de autenticación o null si no existe
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Verifica si hay un token de autenticación válido
 * @returns {boolean} True si hay un token válido, false en caso contrario
 */
const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Realiza una petición a la API con el token de autenticación
 * @param {string} endpoint - El endpoint de la API
 * @param {Object} options - Opciones adicionales para la petición
 * @returns {Promise<any>} La respuesta de la API
 */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No hay token de autenticación disponible');
    throw new Error('No hay token de autenticación');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Realizando petición autenticada a: ${url}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido o expirado, eliminar del localStorage
        console.error('Token inválido o expirado, eliminando de localStorage');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
      
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear la respuesta como JSON, usar el mensaje de error por defecto
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`Datos recibidos de ${endpoint}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error en la petición a ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Inicia sesión con las credenciales proporcionadas
 * @param {string} email - El email del usuario
 * @param {string} password - La contraseña del usuario
 * @returns {Promise<Object>} Los datos del usuario y el token
 */
const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Intentando iniciar sesión para: ${email} en ${API_BASE_URL}/api/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear la respuesta como JSON, usar el mensaje de error por defecto
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Datos recibidos del servidor:', data);
    
    if (!data || !data.token) {
      throw new Error('No se recibieron datos de usuario');
    }
    
    // Guardar el token en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      console.log('Token guardado en localStorage');
    }
    
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario
 */
const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

/**
 * Obtiene los datos del usuario actual
 * @returns {Promise<Object>} Los datos del usuario
 */
const getCurrentUser = async (): Promise<any> => {
  return fetchWithAuth('/api/users/me');
};

/**
 * Obtiene todos los usuarios
 * @returns {Promise<Array>} Lista de usuarios
 */
const getUsers = async (): Promise<any[]> => {
  return fetchWithAuth('/api/users');
};

/**
 * Obtiene los proyectos del usuario
 * @returns {Promise<Array>} Lista de proyectos
 */
const getProjects = async (): Promise<any[]> => {
  try {
    console.log('Obteniendo proyectos para el usuario actual');
    const projects = await fetchWithAuth('/api/projects');
    console.log('Proyectos obtenidos:', projects);
    return projects;
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    throw error;
  }
};

/**
 * Obtiene un proyecto por su ID
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Object>} Datos del proyecto
 */
const getProjectById = async (projectId: string): Promise<any> => {
  return fetchWithAuth(`/api/projects/${projectId}`);
};

/**
 * Crea un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 * @returns {Promise<Object>} El proyecto creado
 */
const createProject = async (projectData: any): Promise<any> => {
  return fetchWithAuth('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
};

/**
 * Actualiza un proyecto existente
 * @param {string} projectId - ID del proyecto
 * @param {Object} projectData - Datos actualizados del proyecto
 * @returns {Promise<Object>} El proyecto actualizado
 */
const updateProject = async (projectId: string, projectData: any): Promise<any> => {
  return fetchWithAuth(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(projectData)
  });
};

/**
 * Elimina un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Object>} Respuesta de la API
 */
const deleteProject = async (projectId: string): Promise<any> => {
  return fetchWithAuth(`/api/projects/${projectId}`, {
    method: 'DELETE'
  });
};

/**
 * Obtiene las tareas de un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Array>} Lista de tareas
 */
const getTasksByProject = async (projectId: string): Promise<any[]> => {
  return fetchWithAuth(`/api/projects/${projectId}/tasks`);
};

/**
 * Crea una nueva tarea
 * @param {Object} taskData - Datos de la tarea
 * @returns {Promise<Object>} La tarea creada
 */
const createTask = async (taskData: any): Promise<any> => {
  return fetchWithAuth('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
};

/**
 * Actualiza una tarea existente
 * @param {string} taskId - ID de la tarea
 * @param {Object} taskData - Datos actualizados de la tarea
 * @returns {Promise<Object>} La tarea actualizada
 */
const updateTask = async (taskId: string, taskData: any): Promise<any> => {
  return fetchWithAuth(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
};

/**
 * Elimina una tarea
 * @param {string} taskId - ID de la tarea
 * @returns {Promise<Object>} Respuesta de la API
 */
const deleteTask = async (taskId: string): Promise<any> => {
  return fetchWithAuth(`/api/tasks/${taskId}`, {
    method: 'DELETE'
  });
};

/**
 * Sube un archivo adjunto
 * @param {FormData} formData - Datos del formulario con el archivo
 * @returns {Promise<Object>} El archivo adjunto creado
 */
const uploadAttachment = async (formData: FormData): Promise<any> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/attachments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al subir archivo:', error);
    throw error;
  }
};

/**
 * Descarga un archivo adjunto
 * @param {string} attachmentId - ID del archivo adjunto
 * @returns {Promise<Blob>} El archivo adjunto
 */
const downloadAttachment = async (attachmentId: string): Promise<Blob> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    throw error;
  }
};

// Exportar las funciones
export {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  getUsers,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  uploadAttachment,
  downloadAttachment
};
