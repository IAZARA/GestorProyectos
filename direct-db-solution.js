/**
 * Solución directa para obtener usuarios de la base de datos sin usar una API
 * Este script modifica el userStore.ts para que obtenga los usuarios directamente de la base de datos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma
const prisma = new PrismaClient();

// Ruta al archivo del store de usuarios
const userStorePath = path.join(process.cwd(), 'store', 'userStore.ts');

console.log(`Verificando archivo: ${userStorePath}`);

// Comprobar si el archivo existe
if (!fs.existsSync(userStorePath)) {
  console.error(`El archivo ${userStorePath} no existe.`);
  process.exit(1);
}

// Obtener usuarios de la base de datos
async function getUsers() {
  try {
    console.log('Obteniendo usuarios de la base de datos...');
    
    const users = await prisma.user.findMany({
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
    
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  try {
    // Obtener usuarios de la base de datos
    const dbUsers = await getUsers();
    
    if (dbUsers.length === 0) {
      console.error('No se encontraron usuarios en la base de datos.');
      process.exit(1);
    }
    
    // Crear una copia de seguridad del archivo original
    const backupPath = `${userStorePath}.direct-db-backup`;
    fs.copyFileSync(userStorePath, backupPath);
    console.log(`Copia de seguridad creada en: ${backupPath}`);
    
    // Leer el contenido del archivo
    let content = fs.readFileSync(userStorePath, 'utf8');
    
    // Generar el código para los usuarios iniciales
    const usersCode = dbUsers.map(user => {
      return `  {
    id: '${user.id}',
    firstName: '${user.firstName}',
    lastName: '${user.lastName}',
    expertise: '${user.expertise}',
    role: '${user.role}',
    photoUrl: '${user.photoUrl || ''}',
    email: '${user.email}',
    password: '${user.password}'
  }`;
    }).join(',\n');
    
    // Reemplazar los usuarios iniciales
    const initialUsersPattern = /const initialUsers: User\[\] = \[([\s\S]*?)\];/;
    const newInitialUsers = `const initialUsers: User[] = [\n${usersCode}\n];`;
    
    if (initialUsersPattern.test(content)) {
      content = content.replace(initialUsersPattern, newInitialUsers);
      console.log('Usuarios iniciales reemplazados correctamente.');
    } else {
      console.error('No se encontró el patrón de usuarios iniciales en el archivo.');
      process.exit(1);
    }
    
    // Modificar la función loadFromLocalStorage para que siempre devuelva los usuarios iniciales
    const loadFromLocalStoragePattern = /const loadFromLocalStorage = \(\): \{ users: User\[\], currentUser: User \| null \} \| null => \{([\s\S]*?)return null;\s*\};/;
    const newLoadFromLocalStorage = `const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return { users: initialUsers, currentUser: null };
    }
    
    // Obtener solo el currentUser de localStorage
    const savedState = getLocalStorage('user-storage');
    
    // SIEMPRE devolver todos los usuarios iniciales
    return {
      users: initialUsers,
      currentUser: savedState?.currentUser || null
    };
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return { users: initialUsers, currentUser: null };
  }
};`;
    
    if (loadFromLocalStoragePattern.test(content)) {
      content = content.replace(loadFromLocalStoragePattern, newLoadFromLocalStorage);
      console.log('Función loadFromLocalStorage modificada correctamente.');
    } else {
      console.error('No se encontró el patrón de la función loadFromLocalStorage en el archivo.');
      process.exit(1);
    }
    
    // Guardar los cambios
    fs.writeFileSync(userStorePath, content);
    console.log(`Archivo userStore.ts actualizado correctamente.`);
    
    // Reiniciar la aplicación
    try {
      console.log('Reiniciando la aplicación...');
      execSync('pm2 restart app-server');
      console.log('Aplicación reiniciada correctamente.');
    } catch (error) {
      console.error('Error al reiniciar la aplicación:', error.message);
      console.log('Por favor, reinicia manualmente: pm2 restart app-server');
    }
    
    console.log(`
=======================================================
SOLUCIÓN COMPLETADA
=======================================================

Se han realizado los siguientes cambios:

1. Se han obtenido ${dbUsers.length} usuarios directamente de la base de datos PostgreSQL.

2. Se ha reemplazado la lista de usuarios iniciales en el archivo userStore.ts con
   los usuarios obtenidos de la base de datos.

3. Se ha modificado la función loadFromLocalStorage para que siempre devuelva
   todos los usuarios de la base de datos.

4. Se ha reiniciado la aplicación para aplicar los cambios.

Esta solución garantiza que todos los usuarios vean la misma lista de usuarios en todos
los navegadores, sin necesidad de crear una API adicional.

Para probar la solución, simplemente accede a la aplicación normalmente. No es necesario
limpiar el localStorage ni realizar ninguna acción adicional.
`);
  } catch (error) {
    console.error('Error en la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 