const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la carga de datos de prueba...');

  // Verificar si ya existen usuarios para evitar duplicados
  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length > 0) {
    console.log(`Ya existen ${existingUsers.length} usuarios en la base de datos.`);
    console.log('Usuarios existentes:');
    existingUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });
    return;
  }

  // Crear usuarios de prueba
  const users = [
    {
      firstName: 'Ivan',
      lastName: 'Zarate',
      email: 'ivan.zarate@minseg.gob.ar',
      password: await bcrypt.hash('Vortex733-', 12),
      expertise: 'Administrativo',
      role: 'Administrador',
      photoUrl: ''
    },
    {
      firstName: 'Maximiliano',
      lastName: 'Scarimbolo',
      email: 'maxi.scarimbolo@minseg.gob.ar',
      password: await bcrypt.hash('gestor123', 12),
      expertise: 'Administrativo',
      role: 'Gestor',
      photoUrl: ''
    },
    {
      firstName: 'Usuario',
      lastName: 'Normal',
      email: 'usuario@sistema.com',
      password: await bcrypt.hash('usuario123', 12),
      expertise: 'Legal',
      role: 'Usuario',
      photoUrl: 'https://i.pravatar.cc/300?img=3'
    }
  ];

  // Insertar usuarios en la base de datos
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`Usuario creado: ${user.firstName} ${user.lastName} (${user.email})`);
  }

  console.log('Carga de datos de prueba completada.');
}

main()
  .catch(e => {
    console.error('Error durante la carga de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
