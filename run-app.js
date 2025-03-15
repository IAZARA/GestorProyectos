/**
 * Script para iniciar y configurar todos los componentes de la aplicación
 * Este script resetea la base de datos, verifica que los servidores estén operativos
 * y pone en marcha todos los servicios necesarios.
 */

const { spawn, exec } = require('child_process');
const { join } = require('path');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Función para imprimir mensajes con color
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Función para formatear los logs
const formatLog = (serverName, data, color = colors.reset) => {
  return data
    .toString()
    .split('\n')
    .filter(line => line.trim())
    .map(line => `${color}[${serverName}]${colors.reset} ${line}`)
    .join('\n');
};

// Función para ejecutar comandos de forma síncrona
function execSync(cmd) {
  return require('child_process').execSync(cmd, { encoding: 'utf8' });
}

// Función para verificar si un puerto está en uso
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const netstat = exec(`lsof -i :${port}`, (error) => {
      resolve(!error);
    });
    
    // Si tarda más de 2 segundos, asumimos que el puerto está libre
    setTimeout(() => {
      netstat.kill();
      resolve(false);
    }, 2000);
  });
}

// Función para verificar si PostgreSQL está funcionando
async function checkPostgres() {
  try {
    log('Verificando conexión a PostgreSQL...', colors.cyan);
    const result = execSync('pg_isready -h localhost -p 5432');
    
    if (result.includes('accepting connections')) {
      log('✅ PostgreSQL está funcionando correctamente', colors.green);
      return true;
    } else {
      log('❌ PostgreSQL no está disponible', colors.red);
      return false;
    }
  } catch (error) {
    log('❌ Error al verificar PostgreSQL: ' + error.message, colors.red);
    return false;
  }
}

// Función para verificar y crear directorios necesarios
function setupDirectories() {
  const directories = [
    './uploads',
    './uploads/documents',
    './uploads/avatars',
    './logs'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      log(`Creando directorio: ${dir}`, colors.yellow);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  log('✅ Directorios creados/verificados correctamente', colors.green);
}

// Función para resetear la base de datos con Prisma
async function resetDatabase() {
  try {
    log('Reseteando la base de datos...', colors.yellow);
    
    // Ejecutar migraciones de Prisma
    log('Ejecutando migraciones de Prisma...', colors.cyan);
    execSync('npx prisma migrate deploy');
    
    // Generar el cliente de Prisma
    log('Generando cliente de Prisma...', colors.cyan);
    execSync('npx prisma generate');
    
    // Ejecutar el seed para cargar datos iniciales
    log('Cargando datos iniciales...', colors.cyan);
    execSync('node prisma/seed.js');
    
    log('✅ Base de datos inicializada correctamente', colors.green);
    return true;
  } catch (error) {
    log('❌ Error al resetear la base de datos: ' + error.message, colors.red);
    return false;
  }
}

// Función para iniciar un servidor
const startServer = (name, command, args, cwd, color) => {
  log(`\nIniciando servidor ${name}...`, color);
  
  const server = spawn(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  server.stdout.on('data', (data) => {
    console.log(formatLog(name, data, color));
  });

  server.stderr.on('data', (data) => {
    console.error(formatLog(name, data, color));
  });

  server.on('error', (error) => {
    log(`❌ Error al iniciar el servidor ${name}: ${error}`, colors.red);
  });

  server.on('close', (code) => {
    if (code !== null) {
      log(`Servidor ${name} terminado con código ${code}`, code === 0 ? colors.green : colors.red);
    }
  });

  return server;
};

// Función para matar procesos en puertos específicos
async function killProcessesOnPorts() {
  const ports = [3000, 3001, 3005];
  log('Limpiando puertos...', colors.yellow);
  
  for (const port of ports) {
    if (await isPortInUse(port)) {
      log(`Matando proceso en puerto ${port}...`, colors.yellow);
      try {
        if (process.platform === 'win32') {
          execSync(`netstat -ano | findstr :${port} | findstr LISTENING`);
        } else {
          execSync(`lsof -ti :${port} | xargs kill -9`);
        }
      } catch (error) {
        // Ignorar errores si no hay procesos para matar
      }
    }
  }
  
  // También intentar matar por nombre de proceso
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq websocket-server.js" 2>nul');
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq api-server.js" 2>nul');
    } else {
      execSync('pkill -f "websocket-server.js" || true');
      execSync('pkill -f "api-server.js" || true');
      execSync('pkill -f "next dev" || true');
    }
  } catch (error) {
    // Ignorar errores si no hay procesos para matar
  }
  
  // Esperar un momento para asegurarnos que los puertos estén libres
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Array para almacenar los procesos
const processes = [];

// Función para manejar el cierre limpio
const cleanupAndExit = () => {
  log('\nCerrando servidores...', colors.yellow);
  
  processes.forEach(proc => {
    if (!proc.killed) {
      proc.kill();
    }
  });

  // Esperar un momento antes de salir
  setTimeout(() => {
    log('Todos los procesos terminados. ¡Hasta pronto!', colors.green);
    process.exit(0);
  }, 1000);
};

// Registrar handlers para cierre limpio
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

// Función principal
async function main() {
  try {
    log('🚀 Iniciando gestión de proyecto...', colors.green);
    
    const rootDir = process.cwd();
    
    // Verificar y crear directorios necesarios
    setupDirectories();
    
    // Verificar PostgreSQL
    if (!await checkPostgres()) {
      log('❌ No se puede continuar sin PostgreSQL. Por favor, inicie PostgreSQL y vuelva a intentarlo.', colors.red);
      process.exit(1);
    }
    
    // Resetear la base de datos
    if (!await resetDatabase()) {
      log('⚠️ Hubo problemas al resetear la base de datos. Se intentará continuar...', colors.yellow);
    }
    
    // Matar cualquier proceso existente en los puertos
    await killProcessesOnPorts();
    
    // Iniciar Next.js App (puerto 3001)
    const nextApp = startServer(
      'Next.js',
      'npx',
      ['next', 'dev', '-p', '3001'],
      rootDir,
      colors.cyan
    );
    processes.push(nextApp);

    // Iniciar WebSocket Server (puerto 3000)
    const wsServer = startServer(
      'WebSocket',
      'node',
      ['websocket-server.js'],
      join(rootDir, 'local-solution'),
      colors.magenta
    );
    processes.push(wsServer);

    // Iniciar API Server (puerto 3005)
    const apiServer = startServer(
      'API',
      'node',
      ['api-server.js'],
      join(rootDir, 'api'),
      colors.yellow
    );
    processes.push(apiServer);

    log(`
✅ Aplicación iniciada correctamente
🌐 Frontend: http://localhost:3001
🔌 API: http://localhost:3005
📡 WebSocket: http://localhost:3000

📝 Usuarios disponibles:
- Admin: ivan.zarate@minseg.gob.ar / Vortex733-
- Gestor: maxi.scarimbolo@minseg.gob.ar / gestor123
- Normal: usuario@sistema.com / usuario123

Presione Ctrl+C para detener los servidores
    `, colors.green);

  } catch (error) {
    log('❌ Error al iniciar los servidores: ' + error.message, colors.red);
    cleanupAndExit();
  }
}

// Ejecutar
main();