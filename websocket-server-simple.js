/**
 * Servidor de WebSockets simplificado para el Gestor de Proyectos
 * Esta versión está diseñada para desarrollo y no requiere autenticación JWT
 */

const http = require('http');
const NotificationService = require('./notification-service-simple');

// Puerto para el servidor de WebSockets
const PORT = process.env.WEBSOCKET_PORT || 3001;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  // Respuesta simple para verificar que el servidor está funcionando
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'WebSocket server running' }));
    return;
  }
  
  // Para cualquier otra ruta, responder con 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Inicializar el servicio de notificaciones
const notificationService = new NotificationService(server);

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor WebSocket simplificado ejecutándose en el puerto ${PORT}`);
});

// Manejar el cierre del servidor
process.on('SIGINT', () => {
  console.log('Cerrando servidor WebSocket');
  server.close(() => {
    console.log('Servidor WebSocket cerrado');
    process.exit(0);
  });
});

// Exportar el servicio de notificaciones para su uso en otros archivos
module.exports = { server, notificationService };
