const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketServer } = require('./server/socket');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Usar el puerto 3000 por defecto o el especificado en las variables de entorno
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  // Crear el servidor HTTP
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Inicializar el servidor de WebSockets en el mismo servidor HTTP
  const io = initializeSocketServer(server);
  
  // Verificar que el servidor de WebSockets se ha inicializado correctamente
  if (io) {
    console.log('> WebSocket server initialized successfully');
  } else {
    console.error('> Failed to initialize WebSocket server');
  }

  // Iniciar el servidor
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> WebSocket server running on the same port`);
  });
}); 