/**
 * Script para limpiar el localStorage en todos los navegadores
 * Este script genera un archivo HTML que puede ser visitado por los usuarios
 * para limpiar su localStorage y ver la lista completa de usuarios.
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo HTML
const htmlPath = path.join(process.cwd(), 'public', 'clear-storage.html');

// Contenido del archivo HTML
const htmlContent = `<!DOCTYPE html>
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
        // Guardar el token actual si existe
        const token = localStorage.getItem('token');
        
        // Limpiar todo el localStorage
        localStorage.clear();
        
        // Restaurar el token si existía
        if (token) {
          localStorage.setItem('token', token);
        }
        
        alert('Almacenamiento limpiado correctamente. Serás redirigido a la página de inicio de sesión.');
        
        // Redirigir a la página de inicio
        window.location.href = '/';
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
        alert('Error al limpiar el almacenamiento: ' + error.message);
      }
    }
  </script>
</body>
</html>`;

// Crear el directorio si no existe
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Escribir el archivo HTML
fs.writeFileSync(htmlPath, htmlContent);

console.log(`Archivo HTML creado en: ${htmlPath}`);
console.log('Para limpiar el localStorage, visita: http://localhost:3000/clear-storage.html');

// También crear un script JavaScript para limpiar el localStorage programáticamente
const jsPath = path.join(process.cwd(), 'public', 'clear-storage.js');
const jsContent = `/**
 * Script para limpiar el localStorage programáticamente
 */

// Guardar el token actual si existe
const token = localStorage.getItem('token');

// Limpiar todo el localStorage
localStorage.clear();

// Restaurar el token si existía
if (token) {
  localStorage.setItem('token', token);
}

console.log('localStorage limpiado correctamente');
`;

// Escribir el archivo JavaScript
fs.writeFileSync(jsPath, jsContent);

console.log(`Archivo JavaScript creado en: ${jsPath}`);
console.log('Para limpiar el localStorage programáticamente, incluye este script en tu página HTML:');
console.log('<script src="/clear-storage.js"></script>');

// Salir con código de éxito
process.exit(0); 