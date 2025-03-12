const { exec, spawn } = require('child_process');
const os = require('os');
const readline = require('readline');

// Colores para mensajes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

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

// Función para iniciar los servidores
function startServers() {
  console.log(`${colors.green}Iniciando los servidores...${colors.reset}`);
  
  // Iniciar el servidor Next.js
  console.log(`${colors.yellow}Iniciando el servidor Next.js...${colors.reset}`);
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Iniciar el servidor WebSocket
  console.log(`${colors.yellow}Iniciando el servidor WebSocket...${colors.reset}`);
  const wsProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  console.log(`${colors.green}Servidores iniciados.${colors.reset}`);
  console.log(`${colors.yellow}Presiona 'q' para detener los servidores${colors.reset}`);
  
  // Configurar la detección de teclas para detener los servidores
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      console.log(`${colors.red}Deteniendo servidores...${colors.reset}`);
      nextProcess.kill();
      wsProcess.kill();
      process.exit();
    }
  });
  
  // Manejar la terminación de los procesos
  nextProcess.on('close', (code) => {
    console.log(`${colors.red}El servidor Next.js se ha detenido con código ${code}${colors.reset}`);
    wsProcess.kill();
    process.exit();
  });
  
  wsProcess.on('close', (code) => {
    console.log(`${colors.red}El servidor WebSocket se ha detenido con código ${code}${colors.reset}`);
    nextProcess.kill();
    process.exit();
  });
}

// Función principal
async function main() {
  console.log(`${colors.yellow}Verificando si los puertos están en uso...${colors.reset}`);
  
  // Verificar puerto 3000 (Next.js)
  const nextPid = await checkPort(3000);
  if (nextPid) {
    await killProcess(nextPid);
  }
  
  // Verificar puerto 3001 (WebSocket)
  const wsPid = await checkPort(3001);
  if (wsPid) {
    await killProcess(wsPid);
  }
  
  // Iniciar los servidores
  startServers();
}

// Ejecutar la función principal
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 