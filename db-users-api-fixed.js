/**
 * API para obtener usuarios directamente de la base de datos PostgreSQL
 * Este archivo crea un endpoint que devuelve todos los usuarios
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();

// Habilitar CORS para todas las solicitudes
app.use(cors());
app.use(express.json());

// Endpoint para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    console.log('Obteniendo usuarios de la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        photoUrl: true,
        password: true
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Puerto en el que escuchará el servidor (cambiado a 3333 para evitar conflictos)
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor de API de usuarios ejecutándose en el puerto ${PORT}`);
});

// Manejar el cierre del servidor
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
}); 