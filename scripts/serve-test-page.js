/**
 * Servidor HTTP simple para servir la página de prueba de notificaciones
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Servir la página de prueba
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'browser-notification-test.html');
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error al cargar la página: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    });
  } else {
    res.writeHead(404);
    res.end('Página no encontrada');
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log('Presiona Ctrl+C para detener');
}); 