// Verificar si localStorage está disponible
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = "__test_storage__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.error("LocalStorage no está disponible:", e);
    return false;
  }
};

const getLocalStorage = (key: string): any => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    console.log(`[localStorage] Intentando leer: ${key}`);
    const item = window.localStorage.getItem(key);
    if (!item) {
      console.log(`[localStorage] No se encontró ${key}`);
      return null;
    }
    
    const parsed = JSON.parse(item);
    console.log(`[localStorage] Leído exitosamente: ${key}`, 
      typeof parsed === 'object' ? 'objeto/array' : parsed);
    return parsed;
  } catch (error) {
    console.error(`[localStorage] Error al leer '${key}':`, error);
    return null;
  }
};

const setLocalStorage = (key: string, value: any): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    console.log(`[localStorage] Guardando en '${key}':`, 
      typeof value === 'object' ? 'objeto/array' : value);
    
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    
    // Verificar que se haya guardado correctamente
    const saved = window.localStorage.getItem(key);
    if (saved !== serialized) {
      console.error(`[localStorage] Verificación fallida al guardar '${key}'`);
      return false;
    }
    
    console.log(`[localStorage] Guardado exitoso en '${key}'`);
    return true;
  } catch (error) {
    console.error(`[localStorage] Error al guardar en '${key}':`, error);
    return false;
  }
};

const removeLocalStorage = (key: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    console.log(`[localStorage] Eliminando '${key}'`);
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`[localStorage] Error al eliminar '${key}':`, error);
  }
};

const clearLocalStorage = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    console.log('[localStorage] Limpiando todo el almacenamiento');
    window.localStorage.clear();
  } catch (error) {
    console.error('[localStorage] Error al limpiar el storage:', error);
  }
};

// Storage mejorado para Zustand
const enhancedStorage = {
  getItem: (name: string): string | null => {
    if (!isLocalStorageAvailable()) return null;
    
    try {
      console.log(`[enhancedStorage] Intentando cargar ${name}`);
      const str = window.localStorage.getItem(name);
      if (!str) {
        console.log(`[enhancedStorage] No se encontró ${name}`);
        return null;
      }
      
      // Verificar que el JSON es válido
      JSON.parse(str); // Solo para validar
      console.log(`[enhancedStorage] Cargado exitosamente ${name}`);
      return str;
    } catch (e) {
      console.error(`[enhancedStorage] Error cargando ${name}:`, e);
      return null;
    }
  },
  
  setItem: (name: string, value: string): void => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      console.log(`[enhancedStorage] Guardando ${name}`);
      window.localStorage.setItem(name, value);
      
      // Verificar que se guardó correctamente
      const savedData = window.localStorage.getItem(name);
      if (savedData !== value) {
        console.error(`[enhancedStorage] Error de verificación al guardar ${name}`);
      } else {
        console.log(`[enhancedStorage] Guardado exitosamente ${name}`);
      }
    } catch (e) {
      console.error(`[enhancedStorage] Error guardando ${name}:`, e);
    }
  },
  
  removeItem: (name: string): void => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      console.log(`[enhancedStorage] Eliminando ${name}`);
      window.localStorage.removeItem(name);
    } catch (e) {
      console.error(`[enhancedStorage] Error eliminando ${name}:`, e);
    }
  }
};

export {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  isLocalStorageAvailable,
  enhancedStorage
}; 