/**
 * Script para iniciar toda la aplicación
 * Este script inicia tanto el servidor de WebSocket como la aplicación principal (npm run dev)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Función para imprimir mensajes con formato
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
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
    if (code === 0) {
      log(`${name} se ha detenido correctamente.`, color);
    } else {
      log(`${name} se ha detenido con código de salida ${code}.`, colors.red);
    }
  });
  
  return process;
}

// Función para verificar si un puerto está en uso
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Función para matar procesos que estén usando puertos específicos
async function killProcessesOnPorts(ports) {
  for (const port of ports) {
    if (await isPortInUse(port)) {
      log(`Puerto ${port} en uso. Intentando liberar...`, colors.yellow);
      
      if (process.platform === 'win32') {
        // Windows
        spawn('powershell', [
          '-command',
          `Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id (Get-Process | Where-Object {$_.Id -eq $_.OwningProcess}) -Force }`
        ]);
      } else {
        // macOS/Linux
        spawn('sh', ['-c', `lsof -i :${port} -t | xargs kill -9`]);
      }
      
      // Esperar un momento para que se libere el puerto
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Función principal para iniciar la aplicación
async function startApp() {
  try {
    log('Iniciando la aplicación completa...', colors.green);
    
    // Verificar y liberar puertos si es necesario
    await killProcessesOnPorts([3000, 3001]);
    
    // Iniciar el servidor de WebSocket
    const socketServer = startProcess(
      'node',
      ['scripts/websocket-server.js'],
      'SOCKET-SERVER',
      colors.cyan
    );
    
    // Esperar 2 segundos para que el servidor de WebSocket se inicie completamente
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Iniciar la aplicación principal
    const appServer = startProcess(
      'npm',
      ['run', 'dev'],
      'APP-SERVER',
      colors.magenta
    );
    
    // Manejar señales de terminación
    const handleTermination = () => {
      log('Deteniendo todos los procesos...', colors.yellow);
      socketServer.kill();
      appServer.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', handleTermination);
    process.on('SIGTERM', handleTermination);
    
    log('Aplicación iniciada correctamente. Presiona Ctrl+C para detener.', colors.green);
    
  } catch (error) {
    log(`Error al iniciar la aplicación: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Iniciar la aplicación
startApp().catch(error => {
  log(`Error inesperado: ${error.message}`, colors.red);
  process.exit(1);
}); 