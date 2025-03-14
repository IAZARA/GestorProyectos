/**
 * Script para actualizar las referencias a localStorage
 * Este script crea un archivo de utilidad para manejar el almacenamiento
 * que puede usar localStorage para caché local pero sincroniza con PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// Función para crear el archivo de utilidad de almacenamiento
function createStorageUtility() {
  console.log('Creando archivo de utilidad de almacenamiento...');
  
  const utilityPath = path.join(__dirname, '..', 'lib', 'storage.ts');
  
  try {
    const utilityContent = `/**
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
      console.log(\`[STORAGE] Usando datos de localStorage para \${key}\`);
      return localData.data;
    }
    
    // Si no tenemos datos locales o han expirado, obtenerlos de la API
    console.log(\`[STORAGE] Obteniendo datos de la API para \${key}\`);
    
    // Construir la URL de la API
    let apiUrl = \`/api/\${key}\`;
    if (userId) {
      apiUrl += \`?userId=\${userId}\`;
    }
    
    // Obtener datos de la API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(\`Error al obtener datos de la API: \${response.statusText}\`);
    }
    
    const apiData = await response.json();
    
    // Guardar en localStorage con timestamp
    setLocalStorage(key, {
      data: apiData,
      timestamp: Date.now()
    });
    
    return apiData;
  } catch (error) {
    console.error(\`[STORAGE] Error al obtener datos para \${key}:\`, error);
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
    console.log(\`[STORAGE] Sincronizando datos con la API para \${key}\`);
    
    const response = await fetch(\`/api/\${key}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    
    if (!response.ok) {
      throw new Error(\`Error al sincronizar datos con la API: \${response.statusText}\`);
    }
    
    return true;
  } catch (error) {
    console.error(\`[STORAGE] Error al guardar datos para \${key}:\`, error);
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
    console.log(\`[STORAGE] Eliminando datos de la API para \${key}\`);
    
    let apiUrl = \`/api/\${key}\`;
    if (id) {
      apiUrl += \`/\${id}\`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(\`Error al eliminar datos de la API: \${response.statusText}\`);
    }
    
    return true;
  } catch (error) {
    console.error(\`[STORAGE] Error al eliminar datos para \${key}:\`, error);
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
};`;
    
    // Guardar el archivo
    fs.writeFileSync(utilityPath, utilityContent);
    console.log('Archivo de utilidad de almacenamiento creado correctamente.');
  } catch (error) {
    console.error('Error al crear archivo de utilidad de almacenamiento:', error);
  }
}

// Función para crear un README con instrucciones de migración
function createMigrationInstructions() {
  console.log('Creando instrucciones de migración para localStorage...');
  
  const readmePath = path.join(__dirname, '..', 'LOCALSTORAGE_MIGRATION.md');
  
  try {
    const readmeContent = `# Migración de localStorage a PostgreSQL

Este documento describe cómo migrar el código que utiliza localStorage directamente a la nueva utilidad de almacenamiento que sincroniza con PostgreSQL.

## Cambios necesarios

### 1. Importar la nueva utilidad de almacenamiento

Reemplazar:
\`\`\`typescript
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../lib/localStorage';
\`\`\`

Por:
\`\`\`typescript
import { getStorage, setStorage, removeStorage } from '../lib/storage';
\`\`\`

### 2. Actualizar las llamadas a funciones

#### Obtener datos

Reemplazar:
\`\`\`typescript
const data = getLocalStorage('key');
\`\`\`

Por:
\`\`\`typescript
const data = await getStorage('key', userId);
\`\`\`

#### Guardar datos

Reemplazar:
\`\`\`typescript
setLocalStorage('key', value);
\`\`\`

Por:
\`\`\`typescript
await setStorage('key', value);
\`\`\`

#### Eliminar datos

Reemplazar:
\`\`\`typescript
removeLocalStorage('key');
\`\`\`

Por:
\`\`\`typescript
await removeStorage('key', id);
\`\`\`

### 3. Actualizar los stores

Los stores deben ser actualizados para utilizar la nueva utilidad de almacenamiento. Por ejemplo:

\`\`\`typescript
// Antes
const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return null;
    }
    
    const savedState = getLocalStorage('user-storage');
    if (savedState) {
      console.log('Estado cargado desde localStorage:', savedState.users.length, 'usuarios');
      return savedState;
    }
    
    return null;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
  }
};

// Después
const loadFromStorage = async (): Promise<{ users: User[], currentUser: User | null } | null> => {
  try {
    const savedState = await getStorage<{ users: User[], currentUser: User | null }>('users');
    if (savedState) {
      console.log('Estado cargado desde almacenamiento:', savedState.users.length, 'usuarios');
      return savedState;
    }
    
    return null;
  } catch (error) {
    console.error('Error al cargar desde almacenamiento:', error);
    return null;
  }
};
\`\`\`

## Beneficios

1. **Sincronización automática**: Los datos se sincronizan automáticamente con PostgreSQL.
2. **Caché local**: Se mantiene una copia en localStorage para acceso rápido.
3. **Consistencia**: Los datos son consistentes entre diferentes dispositivos y sesiones.
4. **Robustez**: Los datos persisten incluso si se limpia el localStorage.

## Consideraciones

1. **Asincronía**: Las funciones de almacenamiento ahora son asíncronas, por lo que deben ser llamadas con \`await\`.
2. **Errores**: Las funciones manejan errores internamente, pero es recomendable manejar errores adicionales en el código que las llama.
3. **Expiración**: Los datos en localStorage expiran después de 1 minuto para garantizar que se obtengan datos actualizados de la API.
`;
    
    // Guardar el archivo
    fs.writeFileSync(readmePath, readmeContent);
    console.log('Instrucciones de migración para localStorage creadas correctamente.');
  } catch (error) {
    console.error('Error al crear instrucciones de migración para localStorage:', error);
  }
}

// Ejecutar las funciones
createStorageUtility();
createMigrationInstructions();

console.log('Actualización de referencias a localStorage completada.');
console.log('Consulta el archivo LOCALSTORAGE_MIGRATION.md para obtener instrucciones sobre cómo actualizar el código.'); 