const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Eliminar la referencia al servidor de WebSockets por ahora
// const { initializeSocketServer } = require('./server/socket');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Comentar la inicialización del servidor de WebSockets
  // initializeSocketServer(server);

  server.listen(3001, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3001');
  });
}); 