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
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Inicializar el servidor de WebSockets
  initializeSocketServer(server);

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 