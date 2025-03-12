const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Usuarios iniciales que deberían estar en la base de datos
const initialUsers = [
  {
    firstName: 'Ivan',
    lastName: 'Zarate',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: '',
    email: 'ivan.zarate@minseg.gob.ar',
    password: 'Vortex733-'
  },
  {
    firstName: 'Gestor',
    lastName: 'Proyectos',
    expertise: 'Tecnico',
    role: 'Gestor',
    photoUrl: 'https://i.pravatar.cc/300?img=2',
    email: 'gestor@sistema.com',
    password: 'gestor123'
  },
  {
    firstName: 'Usuario',
    lastName: 'Normal',
    expertise: 'Legal',
    role: 'Usuario',
    photoUrl: 'https://i.pravatar.cc/300?img=3',
    email: 'usuario@sistema.com',
    password: 'usuario123'
  }
];

async function syncUsers() {
  console.log('Iniciando sincronización de usuarios...');

  try {
    // Para cada usuario inicial
    for (const userData of initialUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        // Si no existe, crear el usuario
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        });
        
        console.log(`Usuario creado: ${userData.email}`);
      } else {
        console.log(`Usuario ya existe: ${userData.email}`);
      }
    }

    console.log('Sincronización completada con éxito');
  } catch (error) {
    console.error('Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
syncUsers(); 