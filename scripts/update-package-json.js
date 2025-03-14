/**
 * Script para actualizar el package.json
 * Este script actualiza el package.json con nuevos scripts y dependencias
 */

const fs = require('fs');
const path = require('path');

// Función para actualizar el package.json
function updatePackageJson() {
  console.log('Actualizando package.json...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Leer el archivo package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Actualizar scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "start": "node server.js",
      "dev": "next dev",
      "build": "next build",
      "lint": "next lint",
      "migrate": "node scripts/run-migrations.js",
      "start:postgres": "bash scripts/start-app.sh",
      "check:structure": "node scripts/check-project-structure.js",
      "clean:mongodb": "node scripts/clean-mongodb-references.js"
    };
    
    // Eliminar dependencia de MongoDB si existe
    if (packageJson.dependencies && packageJson.dependencies.mongodb) {
      delete packageJson.dependencies.mongodb;
    }
    
    // Asegurarse de que existan las dependencias de PostgreSQL
    packageJson.dependencies = {
      ...packageJson.dependencies,
      "pg": "^8.11.3",
      "knex": "^3.1.0"
    };
    
    // Guardar el archivo actualizado
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('package.json actualizado correctamente.');
  } catch (error) {
    console.error('Error al actualizar package.json:', error);
  }
}

// Ejecutar la función
updatePackageJson();

console.log('Actualización de package.json completada.');
console.log('Ejecuta "npm install" para actualizar las dependencias.'); 