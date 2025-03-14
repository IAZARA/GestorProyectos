/**
 * Script para iniciar toda la aplicación, incluyendo la página de prueba
 */

const { spawn } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para formatear la hora actual
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString();
}

// Función para imprimir mensajes con formato
function log(message, color = colors.reset) {
  console.log(`${color}[${getTimestamp()}] ${message}${colors.reset}`);
}

// Función para iniciar un proceso
function startProcess(command, args, name, color) {
  log(`Iniciando ${name}...`, color);
  
  const process = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}] ${line}${colors.reset}`);
      }
    });
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.red}[${name} ERROR] ${line}${colors.reset}`);
      }
    });
  });
  
  process.on('close', (code) => {
    log(`${name} se ha detenido con código: ${code}`, color);
  });
  
  return process;
}

// Procesos a iniciar
const processes = [];

// Iniciar servidor WebSocket
const socketServer = startProcess(
  'node',
  [path.join(__dirname, 'websocket-server.js')],
  'SOCKET-SERVER',
  colors.cyan
);
processes.push(socketServer);

// Esperar 2 segundos antes de iniciar el servidor de la aplicación
setTimeout(() => {
  // Iniciar servidor de la aplicación
  const appServer = startProcess(
    'npm',
    ['run', 'dev'],
    'APP-SERVER',
    colors.green
  );
  processes.push(appServer);
  
  // Iniciar servidor de la página de prueba
  const testServer = startProcess(
    'node',
    [path.join(__dirname, 'serve-test-page.js')],
    'TEST-SERVER',
    colors.magenta
  );
  processes.push(testServer);
  
  log('Aplicación iniciada correctamente. Presiona Ctrl+C para detener.', colors.yellow);
  log('Página de prueba disponible en: http://localhost:8080', colors.yellow);
}, 2000);

// Manejar señales de terminación
process.on('SIGINT', () => {
  log('Deteniendo todos los procesos...', colors.yellow);
  
  processes.forEach(process => {
    process.kill('SIGINT');
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}); 