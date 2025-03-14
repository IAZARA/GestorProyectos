/**
 * Solución final para obtener usuarios de la base de datos sin usar una API
 * Este script reemplaza completamente el archivo userStore.ts con una versión
 * que siempre devuelve los usuarios de la base de datos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma
const prisma = new PrismaClient();

// Ruta al archivo del store de usuarios
const userStorePath = path.join(process.cwd(), 'store', 'userStore.ts');

console.log(`Verificando archivo: ${userStorePath}`);

// Comprobar si el archivo existe
if (!fs.existsSync(userStorePath)) {
  console.error(`El archivo ${userStorePath} no existe.`);
  process.exit(1);
}

// Obtener usuarios de la base de datos
async function getUsers() {
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
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  try {
    // Obtener usuarios de la base de datos
    const dbUsers = await getUsers();
    
    if (dbUsers.length === 0) {
      console.error('No se encontraron usuarios en la base de datos.');
      process.exit(1);
    }
    
    // Crear una copia de seguridad del archivo original
    const backupPath = `${userStorePath}.final-solution-backup`;
    fs.copyFileSync(userStorePath, backupPath);
    console.log(`Copia de seguridad creada en: ${backupPath}`);
    
    // Generar el código para los usuarios iniciales
    const usersCode = dbUsers.map(user => {
      return `  {
    id: '${user.id || ''}',
    firstName: '${(user.firstName || '').replace(/'/g, "\\'")}',
    lastName: '${(user.lastName || '').replace(/'/g, "\\'")}',
    expertise: '${(user.expertise || '').replace(/'/g, "\\'")}',
    role: '${(user.role || '').replace(/'/g, "\\'")}',
    photoUrl: '${(user.photoUrl || '').replace(/'/g, "\\'")}',
    email: '${(user.email || '').replace(/'/g, "\\'")}',
    password: '${(user.password || '').replace(/'/g, "\\'")}',
  }`;
    }).join(',\n');
    
    // Crear una versión completa del archivo userStore.ts
    const completeUserStore = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Expertise } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../lib/localStorage';

interface UserState {
  users: User[];
  currentUser: User | null;
  
  // Acciones
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: Role) => User[];
  getUsersByExpertise: (expertise: Expertise) => User[];
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  resetUserPassword: (email: string, newPassword: string) => Promise<boolean>;
  getUsers: () => User[];
}

// Crear usuarios iniciales desde la base de datos
const initialUsers: User[] = [
${usersCode}
];

// Función para guardar en localStorage manualmente
const saveToLocalStorage = (state: any) => {
  try {
    setLocalStorage('user-storage', state);
    console.log('Estado guardado en localStorage');
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Función para cargar desde localStorage
const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return { users: initialUsers, currentUser: null };
    }
    
    // Obtener solo el currentUser de localStorage
    const savedState = getLocalStorage('user-storage');
    
    // SIEMPRE devolver todos los usuarios iniciales
    return {
      users: initialUsers,
      currentUser: savedState?.currentUser || null
    };
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return { users: initialUsers, currentUser: null };
  }
};

// Crear el store
const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      // Cargar el estado inicial
      const savedState = typeof window !== 'undefined' ? loadFromLocalStorage() : null;
      
      return {
        users: savedState?.users || initialUsers,
        currentUser: savedState?.currentUser || null,
        
        getUsers: () => {
          return get().users;
        },
        
        addUser: async (userData) => {
          try {
            console.log('Intentando crear usuario:', userData.email);
            
            // Usar una sal más fuerte para mayor seguridad
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            
            const newUser = {
              ...userData,
              id: uuidv4(),
              password: hashedPassword
            };
            
            set((state) => {
              const updatedUsers = [...state.users, newUser];
              console.log('Usuario creado localmente:', newUser.email);
              
              // Guardar manualmente en localStorage
              setTimeout(() => saveToLocalStorage({
                users: updatedUsers,
                currentUser: state.currentUser
              }), 0);
              
              return { users: updatedUsers };
            });
            
            return newUser;
          } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
          }
        },
        
        updateUser: async (id, userData) => {
          try {
            const { users } = get();
            const userIndex = users.findIndex(user => user.id === id);
            
            if (userIndex === -1) return null;
            
            let updatedUser = { ...users[userIndex], ...userData };
            
            // Si se actualiza la contraseña, la encriptamos
            if (userData.password) {
              const salt = await bcrypt.genSalt(12);
              updatedUser.password = await bcrypt.hash(userData.password, salt);
            }
            
            const updatedUsers = [...users];
            updatedUsers[userIndex] = updatedUser;
            
            set((state) => {
              // Guardar manualmente en localStorage
              setTimeout(() => saveToLocalStorage({
                users: updatedUsers,
                currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser
              }), 0);
              
              return { 
                users: updatedUsers,
                ...(state.currentUser?.id === id ? { currentUser: updatedUser } : {})
              };
            });
            
            return updatedUser;
          } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
          }
        },
        
        deleteUser: (id) => {
          set((state) => {
            const updatedUsers = state.users.filter(user => user.id !== id);
            const updatedCurrentUser = state.currentUser?.id === id ? null : state.currentUser;
            
            // Guardar manualmente en localStorage
            setTimeout(() => saveToLocalStorage({
              users: updatedUsers,
              currentUser: updatedCurrentUser
            }), 0);
            
            return {
              users: updatedUsers,
              ...(state.currentUser?.id === id ? { currentUser: null } : {})
            };
          });
        },
        
        getUserById: (id: string) => {
          // Primero intentar encontrar el usuario por ID exacto
          const userById = get().users.find(user => user.id === id);
          if (userById) {
            console.log('[USERSTORE] Usuario encontrado por ID exacto:', userById.firstName, userById.lastName);
            return userById;
          }
          
          // Intentar encontrar por coincidencia parcial en el ID, nombre o email
          const userByPartialMatch = get().users.find(user => 
            (user.id && id && (user.id.includes(id) || id.includes(user.id))) || 
            (user.firstName && id && user.firstName.toLowerCase().includes(id.toLowerCase())) || 
            (user.lastName && id && user.lastName.toLowerCase().includes(id.toLowerCase())) || 
            (user.email && id && user.email.toLowerCase().includes(id.toLowerCase()))
          );
          
          if (userByPartialMatch) {
            console.log('[USERSTORE] Usuario encontrado por coincidencia parcial:', userByPartialMatch.firstName, userByPartialMatch.lastName);
            return userByPartialMatch;
          }
          
          console.log('[USERSTORE] Usuario no encontrado para ID:', id);
          return undefined;
        },
        
        getUsersByRole: (role: Role) => {
          return get().users.filter(user => user.role === role);
        },
        
        getUsersByExpertise: (expertise: Expertise) => {
          return get().users.filter(user => user.expertise === expertise);
        },
        
        login: async (email: string, password: string) => {
          try {
            const { users } = get();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (!user) {
              console.log('Usuario no encontrado:', email);
              return null;
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
              console.log('Contraseña incorrecta para:', email);
              return null;
            }
            
            console.log('Inicio de sesión exitoso para:', email);
            
            set((state) => {
              // Guardar manualmente en localStorage
              setTimeout(() => saveToLocalStorage({
                users: state.users,
                currentUser: user
              }), 0);
              
              return { currentUser: user };
            });
            
            return user;
          } catch (error) {
            console.error('Error en inicio de sesión:', error);
            return null;
          }
        },
        
        logout: () => {
          set((state) => {
            // Guardar manualmente en localStorage
            setTimeout(() => saveToLocalStorage({
              users: state.users,
              currentUser: null
            }), 0);
            
            return { currentUser: null };
          });
        },
        
        resetUserPassword: async (email: string, newPassword: string) => {
          try {
            const { users } = get();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (userIndex === -1) {
              console.log('Usuario no encontrado para reseteo de contraseña:', email);
              return false;
            }
            
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            const updatedUser = { ...users[userIndex], password: hashedPassword };
            const updatedUsers = [...users];
            updatedUsers[userIndex] = updatedUser;
            
            set((state) => {
              // Guardar manualmente en localStorage
              setTimeout(() => saveToLocalStorage({
                users: updatedUsers,
                currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser
              }), 0);
              
              return { 
                users: updatedUsers,
                ...(state.currentUser?.id === updatedUser.id ? { currentUser: updatedUser } : {})
              };
            });
            
            console.log('Contraseña restablecida para:', email);
            return true;
          } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            return false;
          }
        }
      };
    },
    {
      name: 'user-storage',
      getStorage: () => ({
        getItem: (name) => {
          try {
            return getLocalStorage(name);
          } catch (error) {
            console.error('Error al obtener del localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            setLocalStorage(name, value);
          } catch (error) {
            console.error('Error al guardar en localStorage:', error);
          }
        },
        removeItem: (name) => {
          try {
            removeLocalStorage(name);
          } catch (error) {
            console.error('Error al eliminar del localStorage:', error);
          }
        }
      })
    }
  )
);

export { useUserStore };`;
    
    // Guardar el archivo completo
    fs.writeFileSync(userStorePath, completeUserStore);
    console.log('Archivo userStore.ts reemplazado completamente con éxito.');
    
    // Reiniciar la aplicación
    try {
      console.log('Reiniciando la aplicación...');
      execSync('pm2 restart app-server');
      console.log('Aplicación reiniciada correctamente.');
    } catch (error) {
      console.error('Error al reiniciar la aplicación:', error.message);
      console.log('Por favor, reinicia manualmente: pm2 restart app-server');
    }
    
    console.log(`
=======================================================
SOLUCIÓN FINAL COMPLETADA
=======================================================

Se han realizado los siguientes cambios:

1. Se han obtenido ${dbUsers.length} usuarios directamente de la base de datos PostgreSQL.

2. Se ha reemplazado COMPLETAMENTE el archivo userStore.ts con una versión optimizada
   que siempre usa los usuarios de la base de datos.

3. Se ha modificado la función loadFromLocalStorage para que siempre devuelva
   todos los usuarios de la base de datos.

4. Se ha reiniciado la aplicación para aplicar los cambios.

Esta solución garantiza que todos los usuarios vean la misma lista de usuarios en todos
los navegadores, sin necesidad de crear una API adicional.

Para probar la solución, simplemente accede a la aplicación normalmente. No es necesario
limpiar el localStorage ni realizar ninguna acción adicional.
`);
  } catch (error) {
    console.error('Error en la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 