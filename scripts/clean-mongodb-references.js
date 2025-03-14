/**
 * Script para eliminar las dependencias de MongoDB del proyecto
 * Este script actualiza el package.json para eliminar la dependencia de MongoDB
 */

const fs = require('fs');
const path = require('path');

// Función para actualizar el package.json
function updatePackageJson() {
  console.log('Actualizando package.json para eliminar dependencias de MongoDB...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Leer el archivo package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Verificar si existe la dependencia de MongoDB
    if (packageJson.dependencies && packageJson.dependencies.mongodb) {
      console.log('Eliminando dependencia de MongoDB...');
      delete packageJson.dependencies.mongodb;
      
      // Guardar el archivo actualizado
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('Dependencia de MongoDB eliminada correctamente.');
    } else {
      console.log('No se encontró la dependencia de MongoDB en package.json.');
    }
  } catch (error) {
    console.error('Error al actualizar package.json:', error);
  }
}

// Función para crear un archivo .gitignore para scripts legacy
function updateGitignore() {
  console.log('Actualizando .gitignore para ignorar scripts legacy...');
  
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  try {
    // Leer el archivo .gitignore
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    // Verificar si ya existe la entrada para scripts/legacy
    if (!gitignoreContent.includes('scripts/legacy')) {
      // Añadir la entrada para scripts/legacy
      gitignoreContent += '\n# Scripts legacy que ya no se usan\nscripts/legacy/\n';
      
      // Guardar el archivo actualizado
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('Archivo .gitignore actualizado correctamente.');
    } else {
      console.log('La entrada para scripts/legacy ya existe en .gitignore.');
    }
  } catch (error) {
    console.error('Error al actualizar .gitignore:', error);
  }
}

// Función para crear un README para scripts legacy
function createLegacyReadme() {
  console.log('Creando README para scripts legacy...');
  
  const readmePath = path.join(__dirname, 'legacy', 'README.md');
  
  try {
    const readmeContent = `# Scripts Legacy

Esta carpeta contiene scripts que ya no se utilizan en la aplicación pero se mantienen como referencia.

Estos scripts fueron utilizados durante la migración de MongoDB a PostgreSQL y para pruebas del sistema de notificaciones.

**Nota:** Estos scripts no funcionarán correctamente ya que la aplicación ahora utiliza PostgreSQL como base de datos.
`;
    
    // Guardar el archivo
    fs.writeFileSync(readmePath, readmeContent);
    console.log('README para scripts legacy creado correctamente.');
  } catch (error) {
    console.error('Error al crear README para scripts legacy:', error);
  }
}

// Ejecutar las funciones
updatePackageJson();
updateGitignore();
createLegacyReadme();

console.log('Limpieza de referencias a MongoDB completada.');
console.log('Ejecuta "npm install" para actualizar las dependencias.'); 