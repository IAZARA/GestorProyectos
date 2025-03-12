const { exec } = require('child_process');
const os = require('os');

// Colores para mensajes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Función para verificar y matar procesos en un puerto específico
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Verificando puerto ${port}...${colors.reset}`);
    
    // Comando para obtener el PID según el sistema operativo
    const findCommand = os.platform() === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;
    
    exec(findCommand, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`${colors.green}No hay procesos usando el puerto ${port}.${colors.reset}`);
        resolve();
        return;
      }
      
      // Obtener el PID
      const pid = os.platform() === 'win32'
        ? stdout.trim().split('\n')[0].split(/\s+/).pop()
        : stdout.trim().split('\n')[0];
      
      console.log(`${colors.yellow}Matando proceso ${pid} en puerto ${port}...${colors.reset}`);
      
      // Comando para matar el proceso según el sistema operativo
      const killCommand = os.platform() === 'win32'
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;
      
      exec(killCommand, (killError) => {
        if (killError) {
          console.log(`${colors.red}Error al matar proceso en puerto ${port}: ${killError.message}${colors.reset}`);
        } else {
          console.log(`${colors.green}Proceso en puerto ${port} terminado exitosamente.${colors.reset}`);
        }
        resolve();
      });
    });
  });
}

// Función principal
async function main() {
  console.log(`${colors.yellow}Verificando y matando procesos en puertos 3000 y 3001...${colors.reset}`);
  
  try {
    // Matar procesos en puerto 3000 (Next.js)
    await killProcessOnPort(3000);
    
    // Matar procesos en puerto 3001 (WebSocket)
    await killProcessOnPort(3001);
    
    console.log(`${colors.green}Operación completada.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 