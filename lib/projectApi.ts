/**
 * API para interactuar con los proyectos en el servidor
 */

import { Project } from '../types/project';

// Obtener la URL base de la API (asegurarse de que sea el puerto 3005)
const API_BASE_URL = 'http://localhost:3005';

/**
 * Obtiene los proyectos del usuario desde la API
 * @param userId ID del usuario para filtrar proyectos
 * @returns Lista de proyectos
 */
export const fetchProjects = async (userId?: string): Promise<Project[]> => {
  try {
    const url = userId 
      ? `${API_BASE_URL}/api/projects?userId=${userId}`
      : `${API_BASE_URL}/api/projects`;
    
    console.log(`Obteniendo proyectos desde: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener proyectos: ${response.statusText}`);
    }
    
    const projects = await response.json();
    console.log(`Proyectos obtenidos: ${projects.length}`);
    
    return projects;
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    throw error;
  }
};

/**
 * Crea un nuevo proyecto en la API
 * @param projectData Datos del proyecto a crear
 * @returns Proyecto creado
 */
export const createProject = async (projectData: any): Promise<Project> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      throw new Error(`Error al crear proyecto: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    throw error;
  }
};
