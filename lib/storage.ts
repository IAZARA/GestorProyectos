/**
 * Utilidad de almacenamiento
 * Este módulo proporciona funciones para manejar el almacenamiento de datos
 * Utiliza localStorage como caché local pero sincroniza con PostgreSQL
 */

import { getLocalStorage, setLocalStorage, removeLocalStorage, clearLocalStorage } from './localStorage';

/**
 * Obtiene un valor del almacenamiento
 * Primero intenta obtenerlo de localStorage, si no existe o está desactualizado
 * lo obtiene de la API y lo guarda en localStorage
 */
export async function getStorage<T>(key: string, userId?: string): Promise<T | null> {
  try {
    // Intentar obtener del localStorage primero (para acceso rápido)
    const localData = getLocalStorage(key);
    
    // Si estamos en el servidor, no podemos usar localStorage
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Si tenemos datos locales y no han expirado, devolverlos
    if (localData && localData.timestamp && (Date.now() - localData.timestamp < 60000)) {
      console.log(`[STORAGE] Usando datos de localStorage para ${key}`);
      return localData.data;
    }
    
    // Si no tenemos datos locales o han expirado, obtenerlos de la API
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
    
    // Guardar en localStorage con timestamp
    setLocalStorage(key, {
      data: apiData,
      timestamp: Date.now()
    });
    
    return apiData;
  } catch (error) {
    console.error(`[STORAGE] Error al obtener datos para ${key}:`, error);
    return null;
  }
}

/**
 * Guarda un valor en el almacenamiento
 * Lo guarda en localStorage y lo sincroniza con la API
 */
export async function setStorage<T>(key: string, value: T): Promise<boolean> {
  try {
    // Guardar en localStorage
    setLocalStorage(key, {
      data: value,
      timestamp: Date.now()
    });
    
    // Si estamos en el servidor, no podemos usar fetch
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Sincronizar con la API
    console.log(`[STORAGE] Sincronizando datos con la API para ${key}`);
    
    const response = await fetch(`/api/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    
    if (!response.ok) {
      throw new Error(`Error al sincronizar datos con la API: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`[STORAGE] Error al guardar datos para ${key}:`, error);
    return false;
  }
}

/**
 * Elimina un valor del almacenamiento
 * Lo elimina de localStorage y lo sincroniza con la API
 */
export async function removeStorage(key: string, id?: string): Promise<boolean> {
  try {
    // Eliminar de localStorage
    removeLocalStorage(key);
    
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
 * Limpia localStorage y lo sincroniza con la API
 */
export async function clearStorage(): Promise<boolean> {
  try {
    // Limpiar localStorage
    clearLocalStorage();
    
    return true;
  } catch (error) {
    console.error('[STORAGE] Error al limpiar almacenamiento:', error);
    return false;
  }
}

export default {
  getStorage,
  setStorage,
  removeStorage,
  clearStorage
};