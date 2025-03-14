/**
 * Utilidad de almacenamiento
 * Este módulo proporciona funciones para manejar el almacenamiento de datos
 * Conecta directamente con la base de datos PostgreSQL a través de la API
 */

/**
 * Obtiene un valor del almacenamiento
 * Lo obtiene directamente de la API conectada a PostgreSQL
 */
export async function getStorage<T>(key: string, userId?: string): Promise<T | null> {
  try {
    // Si estamos en el servidor, no podemos usar fetch
    if (typeof window === 'undefined') {
      return null;
    }
    
    console.log(`[STORAGE] Obteniendo datos de la API para ${key}`);
    
    // Construir la URL de la API
    let apiUrl = `/api/${key}`;
    if (userId) {
      apiUrl += `?userId=${userId}`;
    }
    
    // Obtener datos de la API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener datos de la API: ${response.statusText}`);
    }
    
    const apiData = await response.json();
    return apiData;
  } catch (error) {
    console.error(`[STORAGE] Error al obtener datos para ${key}:`, error);
    return null;
  }
}

/**
 * Guarda un valor en el almacenamiento
 * Lo guarda directamente en la base de datos a través de la API
 */
export async function setStorage<T>(key: string, value: T): Promise<boolean> {
  try {
    // Si estamos en el servidor, no podemos usar fetch
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Sincronizar con la API
    console.log(`[STORAGE] Guardando datos en la API para ${key}`);
    
    const response = await fetch(`/api/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    
    if (!response.ok) {
      throw new Error(`Error al guardar datos en la API: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[STORAGE] Error al guardar datos para ${key}:`, error);
    return false;
  }
}

/**
 * Elimina un valor del almacenamiento
 * Lo elimina directamente de la base de datos a través de la API
 */
export async function removeStorage(key: string, id?: string): Promise<boolean> {
  try {
    // Si estamos en el servidor, no podemos usar fetch
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Sincronizar con la API
    console.log(`[STORAGE] Eliminando datos de la API para ${key}`);
    
    let apiUrl = `/api/${key}`;
    if (id) {
      apiUrl += `/${id}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error al eliminar datos de la API: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[STORAGE] Error al eliminar datos para ${key}:`, error);
    return false;
  }
}

/**
 * Limpia todo el almacenamiento
 * No implementado para la base de datos
 */
export async function clearStorage(): Promise<boolean> {
  console.warn('[STORAGE] La función clearStorage no está implementada para la base de datos');
  return false;
}

export default {
  getStorage,
  setStorage,
  removeStorage,
  clearStorage
};