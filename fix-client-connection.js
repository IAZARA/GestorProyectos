/**
 * Script para verificar y corregir la conexión del cliente al servidor WebSocket
 * Este script debe ejecutarse en el servidor para modificar la configuración del cliente
 */

const fs = require('fs');
const path = require('path');

// Rutas de los archivos del cliente que podrían necesitar modificación
const possibleClientFiles = [
  '/var/www/GestorProyectos/pages/dashboard.js',
  '/var/www/GestorProyectos/pages/dashboard/index.js',
  '/var/www/GestorProyectos/components/NotificationPanel.js',
  '/var/www/GestorProyectos/components/NotificationPanel.jsx',
  '/var/www/GestorProyectos/components/Notifications.js',
  '/var/www/GestorProyectos/components/Notifications.jsx',
  '/var/www/GestorProyectos/context/NotificationContext.js',
  '/var/www/GestorProyectos/context/NotificationContext.jsx',
  '/var/www/GestorProyectos/hooks/useNotifications.js',
  '/var/www/GestorProyectos/hooks/useNotifications.jsx'
];

// Buscar archivos que existen
const existingFiles = possibleClientFiles.filter(file => {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
});

console.log('Archivos encontrados:', existingFiles);

// Patrones a buscar en los archivos
const patterns = [
  {
    search: /io\(['"]http:\/\/localhost:3001['"]/g,
    replace: 'io("http://137.184.198.221:3001"'
  },
  {
    search: /io\(['"]ws:\/\/localhost:3001['"]/g,
    replace: 'io("ws://137.184.198.221:3001"'
  },
  {
    search: /io\(['"]http:\/\/127\.0\.0\.1:3001['"]/g,
    replace: 'io("http://137.184.198.221:3001"'
  },
  {
    search: /io\(['"]ws:\/\/127\.0\.0\.1:3001['"]/g,
    replace: 'io("ws://137.184.198.221:3001"'
  },
  {
    search: /const socket = io\(\)/g,
    replace: 'const socket = io("http://137.184.198.221:3001")'
  },
  {
    search: /const socket = io\(\{.*?\}\)/gs,
    replace: 'const socket = io("http://137.184.198.221:3001", { transports: ["websocket"], autoConnect: true })'
  }
];

// Modificar los archivos encontrados
existingFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Buscar y reemplazar patrones
    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
        console.log(`Patrón encontrado y reemplazado en ${file}: ${pattern.search}`);
      }
    });

    // Buscar código de inicialización de socket.io
    if (content.includes('socket.io-client') || content.includes('socket.io')) {
      console.log(`Archivo ${file} contiene referencias a socket.io`);
      
      // Verificar si hay código para enviar el ID de usuario en la autenticación
      if (!content.includes('auth: { userId:') && !content.includes('auth:{userId:')) {
        // Buscar la inicialización del socket
        const socketInitRegex = /const\s+socket\s*=\s*io\([^)]*\)/g;
        if (socketInitRegex.test(content)) {
          content = content.replace(socketInitRegex, match => {
            if (match.includes('{')) {
              // Ya tiene opciones, añadir auth
              return match.replace(/\)\s*$/, ', auth: { userId: session?.user?.id } )');
            } else {
              // No tiene opciones, añadir objeto completo
              return match.replace(/\)\s*$/, ', { auth: { userId: session?.user?.id } })');
            }
          });
          modified = true;
          console.log(`Añadida autenticación de usuario en ${file}`);
        }
      }
    }

    // Guardar cambios si se modificó el archivo
    if (modified) {
      // Hacer una copia de seguridad del archivo original
      fs.writeFileSync(`${file}.backup`, originalContent);
      console.log(`Copia de seguridad creada: ${file}.backup`);
      
      // Guardar el archivo modificado
      fs.writeFileSync(file, content);
      console.log(`Archivo modificado: ${file}`);
    } else {
      console.log(`No se encontraron patrones para modificar en ${file}`);
    }
  } catch (err) {
    console.error(`Error al procesar el archivo ${file}:`, err);
  }
});

// Buscar archivos adicionales que puedan contener configuración de socket.io
console.log('\nBuscando archivos adicionales que puedan contener configuración de socket.io...');

const findSocketIOFiles = (dir, results = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findSocketIOFiles(filePath, results);
    } else if (
      (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) && 
      !existingFiles.includes(filePath)
    ) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (
          content.includes('socket.io-client') || 
          content.includes('io(') || 
          content.includes('io (') ||
          content.includes('useSocket')
        ) {
          results.push(filePath);
        }
      } catch (err) {
        console.error(`Error al leer el archivo ${filePath}:`, err);
      }
    }
  });
  
  return results;
};

try {
  const additionalFiles = findSocketIOFiles('/var/www/GestorProyectos');
  console.log('Archivos adicionales que podrían contener configuración de socket.io:');
  additionalFiles.forEach(file => console.log(`- ${file}`));
  
  // Procesar archivos adicionales
  additionalFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      let modified = false;

      // Buscar y reemplazar patrones
      patterns.forEach(pattern => {
        if (pattern.search.test(content)) {
          content = content.replace(pattern.search, pattern.replace);
          modified = true;
          console.log(`Patrón encontrado y reemplazado en ${file}: ${pattern.search}`);
        }
      });

      // Guardar cambios si se modificó el archivo
      if (modified) {
        // Hacer una copia de seguridad del archivo original
        fs.writeFileSync(`${file}.backup`, originalContent);
        console.log(`Copia de seguridad creada: ${file}.backup`);
        
        // Guardar el archivo modificado
        fs.writeFileSync(file, content);
        console.log(`Archivo modificado: ${file}`);
      }
    } catch (err) {
      console.error(`Error al procesar el archivo adicional ${file}:`, err);
    }
  });
} catch (err) {
  console.error('Error al buscar archivos adicionales:', err);
}

console.log('\nProceso completado. Por favor, reinicie la aplicación para aplicar los cambios.'); 