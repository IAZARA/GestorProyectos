const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Función para leer el localStorage simulado (para entornos de servidor)
function readLocalStorage() {
  try {
    // Intentar leer desde un archivo que simula localStorage
    // Esto es solo para pruebas en el servidor, ya que localStorage no está disponible
    const filePath = path.join(__dirname, '../.local-storage-backup.json');
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error al leer localStorage simulado:', error);
    return null;
  }
}

async function syncUsers() {
  try {
    console.log('Iniciando sincronización de usuarios...');
    
    // 1. Obtener usuarios de la base de datos
    const dbUsers = await prisma.user.findMany({
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
    
    console.log(`Se encontraron ${dbUsers.length} usuarios en la base de datos.`);
    
    // 2. Obtener usuarios del localStorage simulado (solo para pruebas en servidor)
    const localStorageData = readLocalStorage();
    let storeUsers = [];
    
    if (localStorageData && localStorageData.state && localStorageData.state.users) {
      storeUsers = localStorageData.state.users;
      console.log(`Se encontraron ${storeUsers.length} usuarios en el localStorage simulado.`);
    } else {
      console.log('No se encontraron usuarios en el localStorage simulado.');
    }
    
    // 3. Identificar usuarios que están en el store pero no en la base de datos
    const missingInDB = storeUsers.filter(storeUser => 
      !dbUsers.some(dbUser => 
        dbUser.email.toLowerCase() === storeUser.email.toLowerCase() ||
        dbUser.id === storeUser.id
      )
    );
    
    console.log(`Se encontraron ${missingInDB.length} usuarios en el store que no están en la base de datos.`);
    
    // 4. Agregar usuarios faltantes a la base de datos
    if (missingInDB.length > 0) {
      console.log('Agregando usuarios faltantes a la base de datos:');
      
      for (const user of missingInDB) {
        console.log(`- Agregando usuario: ${user.firstName} ${user.lastName} (${user.email})`);
        
        try {
          // Verificar si el usuario ya existe por email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          if (existingUser) {
            console.log(`  El usuario con email ${user.email} ya existe en la base de datos.`);
            continue;
          }
          
          // Crear el usuario en la base de datos
          // Reutilizar la contraseña hasheada del store si está disponible
          let password = user.password;
          
          // Si la contraseña no parece estar hasheada, hashearla
          if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(12);
            password = await bcrypt.hash('password123', salt); // Contraseña por defecto
            console.log(`  La contraseña no estaba hasheada, se ha generado una nueva.`);
          }
          
          const newUser = await prisma.user.create({
            data: {
              id: user.id, // Mantener el mismo ID si es posible
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              password: password,
              expertise: user.expertise,
              role: user.role,
              photoUrl: user.photoUrl || ''
            }
          });
          
          console.log(`  Usuario agregado exitosamente a la base de datos: ${newUser.id}`);
        } catch (error) {
          console.error(`  Error al agregar usuario ${user.email}:`, error);
        }
      }
    }
    
    // 5. Listar todos los usuarios después de la sincronización
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true
      }
    });
    
    console.log(`\nSincronización completada. Total de usuarios en la base de datos: ${finalUsers.length}`);
    
  } catch (error) {
    console.error('Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la sincronización
syncUsers(); 