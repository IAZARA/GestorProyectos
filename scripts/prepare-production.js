const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colores para mensajes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Función para ejecutar comandos
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Ejecutando: ${command}${colors.reset}`);
    
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        console.error(`${colors.red}${stderr}${colors.reset}`);
        reject(error);
        return;
      }
      
      console.log(`${colors.green}Comando completado exitosamente${colors.reset}`);
      if (stdout) {
        console.log(`${colors.blue}Salida:${colors.reset}\n${stdout}`);
      }
      
      resolve(stdout);
    });
  });
}

// Función para verificar si un puerto está en uso
function checkPort(port) {
  return new Promise((resolve) => {
    const command = os.platform() === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`${colors.green}El puerto ${port} está disponible.${colors.reset}`);
        resolve(null);
      } else {
        const pid = os.platform() === 'win32'
          ? stdout.trim().split('\n')[0].split(/\s+/).pop()
          : stdout.trim().split('\n')[0];
        
        console.log(`${colors.red}El puerto ${port} está siendo utilizado por el proceso ${pid}${colors.reset}`);
        resolve(pid);
      }
    });
  });
}

// Función para matar un proceso
function killProcess(pid) {
  return new Promise((resolve) => {
    if (!pid) {
      resolve();
      return;
    }

    console.log(`${colors.yellow}Terminando el proceso ${pid}...${colors.reset}`);
    
    const command = os.platform() === 'win32'
      ? `taskkill /PID ${pid} /F`
      : `kill -9 ${pid}`;

    exec(command, (error) => {
      if (error) {
        console.log(`${colors.red}Error al terminar el proceso: ${error.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}Proceso terminado.${colors.reset}`);
      }
      resolve();
    });
  });
}

// Función para verificar y crear directorios necesarios
function checkDirectories() {
  console.log(`${colors.yellow}Verificando directorios necesarios...${colors.reset}`);
  
  const directories = [
    './uploads',
    './uploads/documents',
    './uploads/avatars'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`${colors.yellow}Creando directorio: ${dir}${colors.reset}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Crear directorio de uploads si no existe
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Crear directorio de logs si no existe
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  console.log(`${colors.green}Directorios verificados.${colors.reset}`);
}

// Función para verificar y crear archivo .env.production
function checkEnvFile() {
  console.log(`${colors.yellow}Verificando archivo .env.production...${colors.reset}`);
  
  const envPath = path.join(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}Creando archivo .env.production...${colors.reset}`);
    
    // Leer el archivo .env existente
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    
    // Modificar las variables para producción
    const productionContent = envContent
      .replace(/NEXTAUTH_URL="[^"]*"/, 'NEXTAUTH_URL="http://localhost:3000"')
      .replace(/DATABASE_URL="[^"]*"/, 'DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/postgres?schema=public"');
    
    // Escribir el archivo .env.production
    fs.writeFileSync(envPath, productionContent);
    
    console.log(`${colors.green}Archivo .env.production creado.${colors.reset}`);
    console.log(`${colors.yellow}IMPORTANTE: Edita el archivo .env.production con los valores correctos para tu entorno de producción.${colors.reset}`);
  } else {
    console.log(`${colors.green}Archivo .env.production ya existe.${colors.reset}`);
  }
}

// Función para crear un script de inicio para producción
function createStartScript() {
  console.log(`${colors.yellow}Creando script de inicio para producción...${colors.reset}`);
  
  const scriptContent = `#!/bin/bash
# Script para iniciar la aplicación en producción

# Matar procesos en puertos 3000 y 3001 si existen
echo "Verificando puertos..."
node scripts/kill-ports.js

# Iniciar el servidor
echo "Iniciando servidor..."
PORT=3000 NODE_ENV=production node server.js
`;
  
  const scriptPath = path.join(process.cwd(), 'scripts', 'start-production.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Hacer el script ejecutable en sistemas Unix
  if (os.platform() !== 'win32') {
    fs.chmodSync(scriptPath, '755');
  }
  
  console.log(`${colors.green}Script de inicio creado: scripts/start-production.sh${colors.reset}`);
  
  // Crear archivo de configuración para PM2
  const pm2ConfigPath = path.join(process.cwd(), 'ecosystem.config.js');
  const pm2Config = `module.exports = {
  apps: [
    {
      name: 'gestor-proyectos',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};`;
  
  fs.writeFileSync(pm2ConfigPath, pm2Config);
  console.log(`${colors.green}Archivo de configuración PM2 creado: ecosystem.config.js${colors.reset}`);
}

// Función principal
async function main() {
  try {
    console.log(`${colors.green}=== PREPARACIÓN PARA PRODUCCIÓN ===${colors.reset}`);
    
    // Verificar y crear directorios necesarios
    checkDirectories();
    
    // Verificar y crear archivo .env.production
    checkEnvFile();
    
    // Matar procesos en puertos 3000 y 3001 si existen
    console.log(`${colors.yellow}Verificando si los puertos están en uso...${colors.reset}`);
    const nextPid = await checkPort(3000);
    if (nextPid) await killProcess(nextPid);
    
    const wsPid = await checkPort(3001);
    if (wsPid) await killProcess(wsPid);
    
    // Compilar TypeScript a JavaScript
    console.log(`${colors.yellow}Compilando archivos TypeScript...${colors.reset}`);
    await runCommand('npx tsc server/socket.ts --outDir server --esModuleInterop --target es2016 --module commonjs');
    await runCommand('npx tsc lib/prisma.ts --outDir lib --esModuleInterop --target es2016 --module commonjs');
    await runCommand('npx tsc lib/socket.ts --outDir lib --esModuleInterop --target es2016 --module commonjs');
    
    // Construir la aplicación
    console.log(`${colors.yellow}Construyendo la aplicación...${colors.reset}`);
    await runCommand('npm run build');
    
    // Crear script de inicio para producción
    createStartScript();
    
    console.log(`${colors.green}=== PREPARACIÓN COMPLETADA ===${colors.reset}`);
    console.log(`${colors.yellow}Para probar la aplicación en modo producción, ejecuta:${colors.reset}`);
    console.log(`${colors.blue}bash scripts/start-production.sh${colors.reset}`);
    
    console.log(`${colors.yellow}Para desplegar en Digital Ocean:${colors.reset}`);
    console.log(`${colors.blue}1. Crea un Droplet con Ubuntu${colors.reset}`);
    console.log(`${colors.blue}2. Instala Node.js, PostgreSQL y Git${colors.reset}`);
    console.log(`${colors.blue}3. Clona tu repositorio${colors.reset}`);
    console.log(`${colors.blue}4. Configura el archivo .env.production con los valores correctos${colors.reset}`);
    console.log(`${colors.blue}5. Ejecuta: npm install --production${colors.reset}`);
    console.log(`${colors.blue}6. Ejecuta: bash scripts/start-production.sh${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error durante la preparación: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 