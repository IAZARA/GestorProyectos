const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addMissingUsers() {
  try {
    console.log('Verificando usuarios existentes...');
    
    // Verificar si Sofia Varela ya existe
    const sofiaExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'sofi.varela@minseg.gob.ar',
          mode: 'insensitive'
        }
      }
    });
    
    if (!sofiaExists) {
      console.log('Agregando a Sofia Varela a la base de datos...');
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      // Crear el usuario
      const sofia = await prisma.user.create({
        data: {
          firstName: 'Sofia',
          lastName: 'Varela',
          email: 'sofi.varela@minseg.gob.ar',
          password: hashedPassword,
          expertise: 'Legal',
          role: 'Usuario',
          photoUrl: ''
        }
      });
      
      console.log('Sofia Varela agregada exitosamente:', sofia.id);
    } else {
      console.log('Sofia Varela ya existe en la base de datos:', sofiaExists.id);
    }
    
    // Verificar si Maximiliano Scarimbolo ya existe
    const maxiExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'maxi.scarimbolo@minseg.gob.ar',
          mode: 'insensitive'
        }
      }
    });
    
    if (!maxiExists) {
      console.log('Agregando a Maximiliano Scarimbolo a la base de datos...');
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      // Crear el usuario
      const maxi = await prisma.user.create({
        data: {
          firstName: 'Maximiliano',
          lastName: 'Scarimbolo',
          email: 'maxi.scarimbolo@minseg.gob.ar',
          password: hashedPassword,
          expertise: 'Administrativo',
          role: 'Gestor',
          photoUrl: ''
        }
      });
      
      console.log('Maximiliano Scarimbolo agregado exitosamente:', maxi.id);
    } else {
      console.log('Maximiliano Scarimbolo ya existe en la base de datos:', maxiExists.id);
    }
    
    // Verificar si Ivan Zarate ya existe
    const ivanExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'ivan.zarate@minseg.gob.ar',
          mode: 'insensitive'
        }
      }
    });
    
    if (!ivanExists) {
      console.log('Agregando a Ivan Zarate a la base de datos...');
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Vortex733-', salt);
      
      // Crear el usuario
      const ivan = await prisma.user.create({
        data: {
          firstName: 'Ivan',
          lastName: 'Zarate',
          email: 'ivan.zarate@minseg.gob.ar',
          password: hashedPassword,
          expertise: 'Administrativo',
          role: 'Administrador',
          photoUrl: ''
        }
      });
      
      console.log('Ivan Zarate agregado exitosamente:', ivan.id);
    } else {
      console.log('Ivan Zarate ya existe en la base de datos:', ivanExists.id);
    }
    
    // Listar todos los usuarios después de las operaciones
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true
      }
    });
    
    console.log('\nUsuarios en la base de datos después de las operaciones:');
    console.log(JSON.stringify(allUsers, null, 2));
    
  } catch (error) {
    console.error('Error al agregar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingUsers(); 