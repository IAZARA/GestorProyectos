const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Consultando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        createdAt: true,
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios en la base de datos:`);
    console.log(JSON.stringify(users, null, 2));
    
    // Buscar usuarios específicos
    console.log('\nBuscando usuarios específicos:');
    
    const sofia = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'sofi.varela',
          mode: 'insensitive'
        }
      }
    });
    
    console.log('Sofia Varela:', sofia ? 'ENCONTRADO' : 'NO ENCONTRADO');
    if (sofia) console.log(sofia);
    
    const maxi = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'maxi.scarimbolo',
          mode: 'insensitive'
        }
      }
    });
    
    console.log('Maximiliano Scarimbolo:', maxi ? 'ENCONTRADO' : 'NO ENCONTRADO');
    if (maxi) console.log(maxi);
    
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 