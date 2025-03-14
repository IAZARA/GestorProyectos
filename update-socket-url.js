/**
 * Script para actualizar la URL del socket en el cliente WebSocket
 * para que use el nuevo dominio dngbds.online
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo del cliente socket
const socketFilePath = path.join(process.cwd(), 'lib', 'socket.ts');

console.log(`Verificando archivo: ${socketFilePath}`);

// Comprobar si el archivo existe
if (!fs.existsSync(socketFilePath)) {
  console.error(`El archivo ${socketFilePath} no existe.`);
  process.exit(1);
}

// Leer el contenido del archivo
let content = fs.readFileSync(socketFilePath, 'utf8');
console.log(`Archivo leído correctamente. Tamaño: ${content.length} bytes`);

// Crear una copia de seguridad del archivo original
const backupPath = `${socketFilePath}.domain-backup`;
fs.writeFileSync(backupPath, content);
console.log(`Copia de seguridad creada en: ${backupPath}`);

// Modificar la URL del socket para usar el nuevo dominio
const originalContent = content;

// Reemplazar la línea que construye la URL del socket
const socketUrlPattern = /const host = typeof window !== 'undefined' \? window\.location\.hostname : 'localhost';\s*const socketUrl = `http:\/\/\${host}:3001`;/;
const newSocketUrl = "const host = typeof window !== 'undefined' ? window.location.hostname : 'dngbds.online';\n  const socketUrl = `http://\${host}:3001`;";

content = content.replace(socketUrlPattern, newSocketUrl);

// Verificar si se realizaron cambios
if (content === originalContent) {
  console.log('No se detectaron patrones para reemplazar. Intentando un enfoque alternativo...');
  
  // Enfoque alternativo: buscar y reemplazar líneas específicas
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const host = typeof window') && lines[i+1] && lines[i+1].includes('socketUrl')) {
      lines[i] = "  const host = typeof window !== 'undefined' ? window.location.hostname : 'dngbds.online';";
      modified = true;
      console.log(`Línea ${i+1} modificada.`);
    }
  }
  
  if (modified) {
    content = lines.join('\n');
  } else {
    console.log('No se pudieron realizar cambios automáticos. Por favor, actualiza el archivo manualmente.');
    process.exit(1);
  }
}

// Guardar los cambios
fs.writeFileSync(socketFilePath, content);
console.log(`Archivo actualizado correctamente.`);

// También necesitamos actualizar la configuración del servidor WebSocket
const serverSocketPath = path.join(process.cwd(), 'server', 'socket.js');

if (fs.existsSync(serverSocketPath)) {
  console.log(`Verificando archivo del servidor WebSocket: ${serverSocketPath}`);
  
  // Leer el contenido del archivo
  let serverContent = fs.readFileSync(serverSocketPath, 'utf8');
  console.log(`Archivo del servidor leído correctamente. Tamaño: ${serverContent.length} bytes`);
  
  // Crear una copia de seguridad del archivo original
  const serverBackupPath = `${serverSocketPath}.domain-backup`;
  fs.writeFileSync(serverBackupPath, serverContent);
  console.log(`Copia de seguridad del servidor creada en: ${serverBackupPath}`);
  
  // Actualizar la configuración CORS para permitir el nuevo dominio
  const corsPattern = /origin: '\*'/;
  const newCors = "origin: ['*', 'http://dngbds.online', 'https://dngbds.online', 'http://www.dngbds.online', 'https://www.dngbds.online']";
  
  serverContent = serverContent.replace(corsPattern, newCors);
  
  // Guardar los cambios
  fs.writeFileSync(serverSocketPath, serverContent);
  console.log(`Archivo del servidor actualizado correctamente.`);
}

console.log('Proceso completado. Por favor, reinicia la aplicación para aplicar los cambios.'); 