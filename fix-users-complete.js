/**
 * Script para solucionar definitivamente el problema de visualización de usuarios
 * Este script:
 * 1. Reemplaza completamente el archivo userStore.ts con una versión corregida
 * 2. Crea una versión mejorada de clear-storage.html
 * 3. Reinicia la aplicación
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ruta al archivo del store de usuarios
const userStorePath = path.join(process.cwd(), 'store', 'userStore.ts');
const clearStoragePath = path.join(process.cwd(), 'public', 'clear-storage.html');

console.log(`Verificando archivo: ${userStorePath}`);

// Comprobar si el archivo existe
if (!fs.existsSync(userStorePath)) {
  console.error(`El archivo ${userStorePath} no existe.`);
  process.exit(1);
}

// Crear una copia de seguridad del archivo original
const backupPath = `${userStorePath}.final-backup`;
fs.copyFileSync(userStorePath, backupPath);
console.log(`Copia de seguridad creada en: ${backupPath}`);

// Contenido completo del nuevo userStore.ts
const newUserStoreContent = `import { create } from 'zustand';
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

// Crear algunos usuarios iniciales para demostración
const initialUsers: User[] = [
  {
    id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c',
    firstName: 'Iván',
    lastName: 'Zarate',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: '',
    email: 'ivan.zarate@minseg.gob.ar',
    password: bcrypt.hashSync('Vortex733-', 10)
  },
  {
    id: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f',
    firstName: 'Maximiliano',
    lastName: 'Scarimbolo',
    expertise: 'Administrativo',
    role: 'Gestor',
    photoUrl: '',
    email: 'maxi.scarimbolo@minseg.gob.ar',
    password: bcrypt.hashSync('gestor123', 10)
  },
  {
    id: '3',
    firstName: 'Usuario',
    lastName: 'Normal',
    expertise: 'Legal',
    role: 'Usuario',
    photoUrl: 'https://i.pravatar.cc/300?img=3',
    email: 'usuario@sistema.com',
    password: bcrypt.hashSync('usuario123', 10)
  },
  {
    id: '8a2b4c6d-0e1f-4a2b-6c7d-8e9f0a1b2c3d',
    firstName: 'Ricardo',
    lastName: 'Stassi',
    expertise: 'Administrativo',
    role: 'Usuario',
    photoUrl: '',
    email: 'ricardo.stassi@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '9c1d3e5f-7g8h-4i5j-6k7l-8m9n0o1p2q3r',
    firstName: 'Fede',
    lastName: 'Fofanov',
    expertise: 'Tecnico',
    role: 'Usuario',
    photoUrl: '',
    email: 'fede.fofanov@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '5f9c3b7a-6d1c-4b4f-8c1a-9d8e3a7b2c1d',
    firstName: 'Sofia',
    lastName: 'Varela',
    expertise: 'Tecnico',
    role: 'Usuario',
    photoUrl: '',
    email: 'sofia.varela@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  },
  {
    id: '7a1b3c5d-9e8f-4a2b-6c7d-8e9f0a1b2c3d',
    firstName: 'Hernan',
    lastName: 'Salvatore',
    expertise: 'Administrativo',
    role: 'Usuario',
    photoUrl: '',
    email: 'hernan.salvatore@minseg.gob.ar',
    password: bcrypt.hashSync('password123', 10)
  }
];

// Función para guardar en localStorage manualmente
const saveToLocalStorage = (state: any) => {
  try {
    setLocalStorage('user-storage', state);
    console.log('Estado guardado en localStorage:', state.users.length, 'usuarios');
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Función para cargar desde localStorage
// IMPORTANTE: Esta función ahora SIEMPRE devuelve todos los usuarios iniciales
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
              console.log('Total usuarios locales:', updatedUsers.length);
              
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

export { useUserStore };
`;

// Contenido mejorado para clear-storage.html
const newClearStorageContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Limpiar Almacenamiento</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: center;
      line-height: 1.6;
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 30px;
    }
    .container {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    p {
      color: #555;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .button-container {
      margin: 30px 0;
    }
    button {
      background-color: #3498db;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    button:hover {
      background-color: #2980b9;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 4px;
      display: none;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .info-box {
      background-color: #e7f3fe;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 20px 0;
      text-align: left;
    }
    .info-box h3 {
      margin-top: 0;
      color: #2196F3;
    }
    .countdown {
      font-weight: bold;
      font-size: 18px;
      color: #e74c3c;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Solución al Problema de Visualización de Usuarios</h1>
    
    <div class="info-box">
      <h3>¿Qué hace esta página?</h3>
      <p>Esta herramienta limpia los datos almacenados localmente en tu navegador que están causando problemas con la visualización de usuarios en la aplicación.</p>
      <p>Después de usar esta herramienta, podrás ver la lista completa de usuarios en el sistema.</p>
    </div>
    
    <p>Al hacer clic en el botón de abajo, se eliminarán los datos almacenados localmente y serás redirigido a la página de inicio de sesión.</p>
    
    <div class="button-container">
      <button onclick="clearStorage()">Limpiar Almacenamiento y Solucionar Problema</button>
    </div>
    
    <div id="statusMessage" class="status"></div>
    
    <div id="redirectMessage" style="display: none;">
      <p>Almacenamiento limpiado correctamente. Serás redirigido en <span id="countdown" class="countdown">5</span> segundos...</p>
    </div>
  </div>

  <script>
    function clearStorage() {
      try {
        // Guardar el token de autenticación si existe
        const userStorage = localStorage.getItem('user-storage');
        let authToken = null;
        
        if (userStorage) {
          try {
            const parsedStorage = JSON.parse(userStorage);
            if (parsedStorage && parsedStorage.state && parsedStorage.state.currentUser) {
              authToken = parsedStorage.state.currentUser;
            }
          } catch (e) {
            console.error('Error al analizar el almacenamiento de usuario:', e);
          }
        }
        
        // Limpiar todo el localStorage
        localStorage.clear();
        
        // Mostrar mensaje de éxito
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = 'Almacenamiento limpiado correctamente. Ahora podrás ver todos los usuarios del sistema.';
        statusElement.className = 'status success';
        statusElement.style.display = 'block';
        
        // Mostrar mensaje de redirección
        document.getElementById('redirectMessage').style.display = 'block';
        
        // Iniciar cuenta regresiva
        let secondsLeft = 5;
        const countdownElement = document.getElementById('countdown');
        
        const interval = setInterval(() => {
          secondsLeft--;
          countdownElement.textContent = secondsLeft;
          
          if (secondsLeft <= 0) {
            clearInterval(interval);
            // Redirigir a la página de inicio
            window.location.href = '/';
          }
        }, 1000);
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
        
        // Mostrar mensaje de error
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = 'Error al limpiar el almacenamiento: ' + error.message;
        statusElement.className = 'status error';
        statusElement.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;

// Guardar el nuevo contenido del userStore.ts
fs.writeFileSync(userStorePath, newUserStoreContent);
console.log(`Archivo userStore.ts actualizado correctamente.`);

// Crear o actualizar el archivo clear-storage.html
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log(`Directorio 'public' creado.`);
}

fs.writeFileSync(clearStoragePath, newClearStorageContent);
console.log(`Archivo clear-storage.html creado/actualizado correctamente.`);

// Intentar reiniciar la aplicación usando PM2
try {
  console.log('Intentando reiniciar la aplicación...');
  execSync('pm2 restart all');
  console.log('Aplicación reiniciada correctamente.');
} catch (error) {
  console.error('Error al reiniciar la aplicación:', error.message);
  console.log('Por favor, reinicia la aplicación manualmente.');
}

console.log(`
=======================================================
SOLUCIÓN COMPLETADA
=======================================================

Se han realizado los siguientes cambios:

1. Se ha reemplazado completamente el archivo userStore.ts con una versión
   que siempre carga todos los usuarios (7 en total) independientemente
   del navegador o dispositivo.

2. Se ha creado/actualizado la página clear-storage.html con un diseño
   mejorado y funcionalidades adicionales.

3. Se ha intentado reiniciar la aplicación automáticamente.

Para que los usuarios vean los cambios, deben:

1. Visitar: http://dngbds.online/clear-storage.html
2. Hacer clic en el botón "Limpiar Almacenamiento y Solucionar Problema"
3. Iniciar sesión nuevamente

Esto debería resolver definitivamente el problema de visualización de usuarios.
`); 