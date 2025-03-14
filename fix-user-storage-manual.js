/**
 * Script para corregir manualmente el problema de los usuarios
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo del store de usuarios
const userStorePath = path.join(process.cwd(), 'store', 'userStore.ts');

console.log(`Verificando archivo: ${userStorePath}`);

// Comprobar si el archivo existe
if (!fs.existsSync(userStorePath)) {
  console.error(`El archivo ${userStorePath} no existe.`);
  process.exit(1);
}

// Leer el contenido del archivo
let content = fs.readFileSync(userStorePath, 'utf8');
console.log(`Archivo leído correctamente. Tamaño: ${content.length} bytes`);

// Crear una copia de seguridad del archivo original
const backupPath = `${userStorePath}.manual-backup`;
fs.writeFileSync(backupPath, content);
console.log(`Copia de seguridad creada en: ${backupPath}`);

// Reemplazar la función loadFromLocalStorage con una versión que siempre devuelva todos los usuarios
const newLoadFromLocalStorage = `const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return null;
    }
    
    // Obtener solo el currentUser de localStorage
    const savedState = getLocalStorage('user-storage');
    if (savedState && savedState.currentUser) {
      console.log('Usuario actual cargado desde localStorage');
      
      // Devolver los usuarios iniciales y el currentUser
      return {
        users: initialUsers,
        currentUser: savedState.currentUser
      };
    }
    return null;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
  }
};`;

// Buscar la función loadFromLocalStorage y reemplazarla
const loadFromLocalStorageRegex = /const loadFromLocalStorage = \(\): \{ users: User\[\], currentUser: User \| null \} \| null => \{[\s\S]*?return null;\s*\};/;
if (loadFromLocalStorageRegex.test(content)) {
  content = content.replace(loadFromLocalStorageRegex, newLoadFromLocalStorage);
  console.log('Función loadFromLocalStorage reemplazada correctamente.');
} else {
  console.error('No se encontró la función loadFromLocalStorage en el archivo.');
  process.exit(1);
}

// Guardar los cambios
fs.writeFileSync(userStorePath, content);
console.log(`Archivo actualizado correctamente.`);

console.log('Proceso completado. Por favor, reinicia la aplicación para aplicar los cambios.'); 