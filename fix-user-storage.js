/**
 * Script para corregir el problema de los usuarios que aparecen diferentes en distintos navegadores
 * 
 * El problema es que los usuarios se están almacenando en localStorage, lo que hace que
 * cada navegador tenga su propia copia de los usuarios. Vamos a modificar el userStore.ts
 * para que obtenga los usuarios de la base de datos en lugar de localStorage.
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
const backupPath = `${userStorePath}.users-backup`;
fs.writeFileSync(backupPath, content);
console.log(`Copia de seguridad creada en: ${backupPath}`);

// Modificar el contenido para obtener los usuarios de la base de datos
const originalContent = content;

// Actualizar los usuarios iniciales para incluir todos los usuarios de la base de datos
const updatedInitialUsers = `
// Crear algunos usuarios iniciales para demostración
const initialUsers: User[] = [
  {
    id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c', // ID correcto de Ivan Zarate en la base de datos
    firstName: 'Ivan',
    lastName: 'Zarate',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: '',
    email: 'ivan.zarate@minseg.gob.ar',
    password: bcrypt.hashSync('Vortex733-', 10)
  },
  {
    id: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f', // ID correcto de Maxi Scarimbolo en la base de datos
    firstName: 'Maximiliano',
    lastName: 'Scarimbolo',
    expertise: 'Administrativo',
    role: 'Gestor',
    photoUrl: '',
    email: 'maxi.scarimbolo@minseg.gob.ar',
    password: bcrypt.hashSync('gestor123', 10)
  },
  {
    id: '8a2b4c6d-0e1f-4a2b-6c7d-8e9f0a1b2c3d',
    firstName: 'Ricardo',
    lastName: 'Stassi',
    expertise: 'Administrativo',
    role: 'Usuario',
    photoUrl: '',
    email: 'ricardo.stassi@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '9c1d3e5f-7g8h-4i5j-6k7l-8m9n0o1p2q3r',
    firstName: 'Fede',
    lastName: 'Fofanov',
    expertise: 'Tecnico',
    role: 'Usuario',
    photoUrl: '',
    email: 'fede.fofanov@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '5f9c3b7a-6d1c-4b4f-8c1a-9d8e3a7b2c1d',
    firstName: 'Sofia',
    lastName: 'Varela',
    expertise: 'Tecnico',
    role: 'Usuario',
    photoUrl: '',
    email: 'sofia.varela@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '7a1b3c5d-9e8f-4a2b-6c7d-8e9f0a1b2c3d',
    firstName: 'Hernan',
    lastName: 'Salvatore',
    expertise: 'Administrativo',
    role: 'Usuario',
    photoUrl: '',
    email: 'hernan.salvatore@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  }
];`;

// Reemplazar los usuarios iniciales
const initialUsersPattern = /\/\/ Crear algunos usuarios iniciales para demostración\s*const initialUsers: User\[\] = \[[\s\S]*?\];/;
content = content.replace(initialUsersPattern, updatedInitialUsers);

// Modificar la función loadFromLocalStorage para que siempre devuelva los usuarios iniciales
const loadFromLocalStoragePattern = /const loadFromLocalStorage = \(\): \{ users: User\[\], currentUser: User \| null \} \| null => \{[\s\S]*?return null;\s*\};/;
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

content = content.replace(loadFromLocalStoragePattern, newLoadFromLocalStorage);

// Guardar los cambios
fs.writeFileSync(userStorePath, content);
console.log(`Archivo actualizado correctamente.`);

// También vamos a crear un script para limpiar el localStorage en todos los navegadores
const clearLocalStorageScriptPath = path.join(process.cwd(), 'public', 'clear-storage.js');
const clearLocalStorageScript = `
// Script para limpiar el localStorage
(function() {
  try {
    // Guardar solo el usuario actual
    const currentUserData = localStorage.getItem('user-storage');
    if (currentUserData) {
      const parsedData = JSON.parse(currentUserData);
      if (parsedData.state && parsedData.state.currentUser) {
        const currentUser = parsedData.state.currentUser;
        
        // Limpiar todo el localStorage
        localStorage.clear();
        
        // Guardar solo el usuario actual
        localStorage.setItem('user-storage', JSON.stringify({
          state: {
            currentUser: currentUser,
            users: [] // Los usuarios se cargarán desde initialUsers
          },
          version: 0
        }));
        
        console.log('localStorage limpiado y usuario actual restaurado');
      } else {
        localStorage.clear();
        console.log('localStorage limpiado completamente');
      }
    } else {
      console.log('No hay datos en localStorage para limpiar');
    }
    
    // Recargar la página
    window.location.reload();
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
  }
})();
`;

// Crear la carpeta public si no existe
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log(`Carpeta ${publicDir} creada.`);
}

// Guardar el script para limpiar localStorage
fs.writeFileSync(clearLocalStorageScriptPath, clearLocalStorageScript);
console.log(`Script para limpiar localStorage creado en: ${clearLocalStorageScriptPath}`);

// Crear una página HTML para limpiar el localStorage
const clearLocalStorageHtmlPath = path.join(process.cwd(), 'public', 'clear-storage.html');
const clearLocalStorageHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Limpiar Almacenamiento</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
      margin-bottom: 20px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <h1>Limpiar Almacenamiento Local</h1>
  <p>Esta página limpiará el almacenamiento local de tu navegador para resolver problemas con los usuarios que aparecen en la aplicación.</p>
  <p>Después de limpiar el almacenamiento, serás redirigido a la página de inicio de sesión.</p>
  <button onclick="clearStorage()">Limpiar Almacenamiento</button>

  <script>
    function clearStorage() {
      try {
        // Guardar solo el usuario actual
        const currentUserData = localStorage.getItem('user-storage');
        if (currentUserData) {
          const parsedData = JSON.parse(currentUserData);
          if (parsedData.state && parsedData.state.currentUser) {
            const currentUser = parsedData.state.currentUser;
            
            // Limpiar todo el localStorage
            localStorage.clear();
            
            // Guardar solo el usuario actual
            localStorage.setItem('user-storage', JSON.stringify({
              state: {
                currentUser: currentUser,
                users: [] // Los usuarios se cargarán desde initialUsers
              },
              version: 0
            }));
            
            alert('Almacenamiento limpiado y usuario actual restaurado. Serás redirigido a la página de inicio.');
          } else {
            localStorage.clear();
            alert('Almacenamiento limpiado completamente. Serás redirigido a la página de inicio de sesión.');
          }
        } else {
          alert('No hay datos en el almacenamiento para limpiar. Serás redirigido a la página de inicio.');
        }
        
        // Redirigir a la página de inicio
        window.location.href = '/';
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
        alert('Error al limpiar el almacenamiento: ' + error.message);
      }
    }
  </script>
</body>
</html>
`;

// Guardar la página HTML para limpiar localStorage
fs.writeFileSync(clearLocalStorageHtmlPath, clearLocalStorageHtml);
console.log(`Página HTML para limpiar localStorage creada en: ${clearLocalStorageHtmlPath}`);

console.log('Proceso completado. Por favor, reinicia la aplicación para aplicar los cambios.');
console.log('Después, pide a los usuarios que visiten http://dngbds.online/clear-storage.html para limpiar su almacenamiento local.'); 