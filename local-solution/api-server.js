/**
 * Servidor de API para el Gestor de Proyectos
 * Este archivo configura un servidor Express que sirve como punto de entrada para todas las APIs
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const userRoutes = require('./api-users');
const projectRoutes = require('./api-projects');
const taskRoutes = require('./api-tasks');
const { router: authRoutes, verifyToken } = require('./api-auth');

// Inicializar Prisma
const prisma = new PrismaClient();

// Crear la aplicación Express
const app = express();
const PORT = process.env.API_PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes); // Proteger rutas de usuarios
app.use('/api/projects', verifyToken, projectRoutes); // Proteger rutas de proyectos
app.use('/api/tasks', verifyToken, taskRoutes); // Proteger rutas de tareas

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor API ejecutándose en el puerto ${PORT}`);
});

// Manejar el cierre del servidor
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
});

module.exports = app; 