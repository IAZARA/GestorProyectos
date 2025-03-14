/**
 * Script para verificar la estructura del proyecto
 * Este script verifica que la estructura del proyecto sea correcta
 * y que no haya referencias a MongoDB u otras bases de datos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Función para verificar la estructura de directorios
function checkDirectoryStructure() {
  console.log('Verificando estructura de directorios...');
  
  const requiredDirs = [
    'app',
    'components',
    'config',
    'lib',
    'migrations',
    'pages',
    'pages/api',
    'public',
    'scripts',
    'store',
    'types',
    'uploads'
  ];
  
  const missingDirs = [];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
    }
  }
  
  if (missingDirs.length > 0) {
    console.error('Faltan los siguientes directorios:', missingDirs.join(', '));
  } else {
    console.log('Estructura de directorios correcta.');
  }
}

// Función para verificar referencias a MongoDB
function checkMongoDBReferences() {
  console.log('Verificando referencias a MongoDB...');
  
  try {
    // Buscar referencias a MongoDB en el código
    const result = execSync('grep -r "mongodb\\|mongo" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir="scripts/legacy" .', { encoding: 'utf8' });
    
    if (result) {
      console.error('Se encontraron referencias a MongoDB en los siguientes archivos:');
      console.error(result);
    } else {
      console.log('No se encontraron referencias a MongoDB.');
    }
  } catch (error) {
    if (error.status === 1) {
      console.log('No se encontraron referencias a MongoDB.');
    } else {
      console.error('Error al buscar referencias a MongoDB:', error);
    }
  }
}

// Función para verificar la configuración de la base de datos
function checkDatabaseConfig() {
  console.log('Verificando configuración de la base de datos...');
  
  const dbConfigPath = path.join(__dirname, '..', 'config', 'database.js');
  
  if (!fs.existsSync(dbConfigPath)) {
    console.error('No se encontró el archivo de configuración de la base de datos.');
    return;
  }
  
  try {
    const dbConfig = require(dbConfigPath);
    
    if (dbConfig.client !== 'pg') {
      console.error('La configuración de la base de datos no utiliza PostgreSQL.');
    } else {
      console.log('Configuración de la base de datos correcta.');
    }
  } catch (error) {
    console.error('Error al verificar la configuración de la base de datos:', error);
  }
}

// Función para verificar las dependencias
function checkDependencies() {
  console.log('Verificando dependencias...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('No se encontró el archivo package.json.');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    // Verificar si existe la dependencia de MongoDB
    if (dependencies.mongodb) {
      console.error('Se encontró la dependencia de MongoDB en package.json.');
    } else {
      console.log('No se encontró la dependencia de MongoDB en package.json.');
    }
    
    // Verificar si existe la dependencia de PostgreSQL
    if (dependencies.pg) {
      console.log('Se encontró la dependencia de PostgreSQL en package.json.');
    } else {
      console.error('No se encontró la dependencia de PostgreSQL en package.json.');
    }
    
    // Verificar si existe la dependencia de Knex
    if (dependencies.knex) {
      console.log('Se encontró la dependencia de Knex en package.json.');
    } else {
      console.error('No se encontró la dependencia de Knex en package.json.');
    }
  } catch (error) {
    console.error('Error al verificar las dependencias:', error);
  }
}

// Función para verificar los scripts de inicio
function checkStartupScripts() {
  console.log('Verificando scripts de inicio...');
  
  const startAppPath = path.join(__dirname, 'start-app.sh');
  
  if (!fs.existsSync(startAppPath)) {
    console.error('No se encontró el script de inicio start-app.sh.');
  } else {
    console.log('Script de inicio start-app.sh encontrado.');
  }
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('No se encontró el archivo package.json.');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const scripts = packageJson.scripts || {};
    
    // Verificar si existe el script de inicio
    if (scripts.start) {
      console.log('Se encontró el script de inicio en package.json.');
    } else {
      console.error('No se encontró el script de inicio en package.json.');
    }
    
    // Verificar si existe el script de desarrollo
    if (scripts.dev) {
      console.log('Se encontró el script de desarrollo en package.json.');
    } else {
      console.error('No se encontró el script de desarrollo en package.json.');
    }
  } catch (error) {
    console.error('Error al verificar los scripts de inicio:', error);
  }
}

// Función para verificar las migraciones
function checkMigrations() {
  console.log('Verificando migraciones...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('No se encontró el directorio de migraciones.');
    return;
  }
  
  try {
    const files = fs.readdirSync(migrationsDir);
    
    if (files.length === 0) {
      console.error('No se encontraron archivos de migración.');
    } else {
      console.log(`Se encontraron ${files.length} archivos de migración.`);
    }
  } catch (error) {
    console.error('Error al verificar las migraciones:', error);
  }
}

// Función para verificar los archivos de API
function checkApiFiles() {
  console.log('Verificando archivos de API...');
  
  const apiDir = path.join(__dirname, '..', 'pages', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('No se encontró el directorio de API.');
    return;
  }
  
  try {
    const files = fs.readdirSync(apiDir);
    
    if (files.length === 0) {
      console.error('No se encontraron archivos de API.');
    } else {
      console.log(`Se encontraron ${files.length} archivos/directorios de API.`);
    }
  } catch (error) {
    console.error('Error al verificar los archivos de API:', error);
  }
}

// Ejecutar las funciones
checkDirectoryStructure();
console.log('');
checkMongoDBReferences();
console.log('');
checkDatabaseConfig();
console.log('');
checkDependencies();
console.log('');
checkStartupScripts();
console.log('');
checkMigrations();
console.log('');
checkApiFiles();

console.log('\nVerificación de la estructura del proyecto completada.');
console.log('Revisa los mensajes anteriores para ver si hay problemas que necesiten ser corregidos.'); 