import { create } from 'zustand';
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
    id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c', // ID correcto de Ivan Zarate en la base de datos
    firstName: 'Ivan',
    lastName: 'Zarate',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: '',
    email: 'ivan.zarate@minseg.gob.ar',
    password: bcrypt.hashSync('Vortex733-', 10)
  },
  {
    id: 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f', // ID correcto de Maxi Scarimbolo en la base de datos
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

// Función para cargar desde localStorage manualmente
const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return null;
    }
    
    const savedState = getLocalStorage('user-storage');
    if (savedState) {
      console.log('Estado cargado desde localStorage:', savedState.users.length, 'usuarios');
      
      // Corregir el ID de Ivan Zarate si es necesario
      if (savedState.users) {
        savedState.users = savedState.users.map(user => {
          if (user.email === 'ivan.zarate@minseg.gob.ar' && user.id !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
            console.log('Corrigiendo ID de Ivan Zarate en localStorage:', user.id, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
            return { ...user, id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c' };
          }
          return user;
        });
        
        // Corregir el currentUser si es Ivan Zarate
        if (savedState.currentUser && savedState.currentUser.email === 'ivan.zarate@minseg.gob.ar' && savedState.currentUser.id !== '857af152-2fd5-4a4b-a8cb-468fc2681f5c') {
          console.log('Corrigiendo ID de Ivan Zarate en currentUser:', savedState.currentUser.id, '->', '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
          savedState.currentUser = { ...savedState.currentUser, id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c' };
        }
      }
      
      return savedState;
    }
    return null;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
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
            
            // Intentar guardar en la base de datos si estamos en el cliente
            if (typeof window !== 'undefined') {
              try {
                // Aquí deberíamos hacer una llamada a la API para crear el usuario en la base de datos
                const response = await fetch('/api/users', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...userData,
                    password: userData.password // La API se encargará de hashear la contraseña
                  }),
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('Error al crear usuario en la API:', errorData);
                  throw new Error('Error al crear usuario en la base de datos');
                }
                
                const createdUser = await response.json();
                console.log('Usuario creado en la base de datos:', createdUser);
                
                // Usar el ID generado por la base de datos
                newUser.id = createdUser.id;
              } catch (apiError) {
                console.error('Error al llamar a la API para crear usuario:', apiError);
                // Continuar con la creación local, pero loguear el error
              }
            }
            
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
        
        resetUserPassword: async (email: string, newPassword: string) => {
          try {
            const { users } = get();
            const userIndex = users.findIndex(user => user.email === email);
            
            if (userIndex === -1) {
              console.log('Usuario no encontrado para reseteo de contraseña:', email);
              return false;
            }
            
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            const updatedUsers = [...users];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              password: hashedPassword
            };
            
            set((state) => {
              // Guardar manualmente en localStorage
              setTimeout(() => saveToLocalStorage({
                users: updatedUsers,
                currentUser: state.currentUser
              }), 0);
              
              return { users: updatedUsers };
            });
            
            console.log('Contraseña actualizada exitosamente para:', email);
            console.log('Nueva contraseña hasheada:', hashedPassword.substring(0, 10) + '...');
            return true;
          } catch (error) {
            console.error('Error al resetear contraseña:', error);
            return false;
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
          
          // Casos específicos conocidos
          if (id && (id.includes('ivan') || id.includes('zarate'))) {
            const ivanZarate = get().users.find(user => user.id === '857af152-2fd5-4a4b-a8cb-468fc2681f5c');
            if (ivanZarate) {
              console.log('[USERSTORE] Corrigiendo ID para Ivan Zarate:', id, '->', ivanZarate.id);
              return ivanZarate;
            }
          }
          
          if (id && (id.includes('maxi') || id.includes('scarimbolo'))) {
            const maxiScarimbolo = get().users.find(user => user.id === 'e3fc93f9-9941-4840-ac2c-a30a7fcd322f');
            if (maxiScarimbolo) {
              console.log('[USERSTORE] Corrigiendo ID para Maxi Scarimbolo:', id, '->', maxiScarimbolo.id);
              return maxiScarimbolo;
            }
          }
          
          console.error('[USERSTORE] Usuario no encontrado con ID:', id);
          return undefined;
        },
        
        getUsersByRole: (role) => {
          return get().users.filter(user => user.role === role);
        },
        
        getUsersByExpertise: (expertise) => {
          return get().users.filter(user => user.expertise === expertise);
        },
        
        login: async (email, password) => {
          try {
            const user = get().users.find(user => user.email === email);
            
            if (!user) {
              console.log('Usuario no encontrado:', email);
              return null;
            }
            
            console.log('Intentando login para:', email);
            console.log('Contraseña almacenada (primeros 20 caracteres):', user.password.substring(0, 20));
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
              console.log('Contraseña incorrecta para usuario:', email);
              return null;
            }
            
            console.log('Login exitoso para usuario:', email);
            
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
            console.error('Error al verificar contraseña:', error);
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
        }
      };
    },
    {
      name: 'user-storage',
      // Solo usar storage en el cliente
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') {
            return null;
          }
          return getLocalStorage(name);
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            setLocalStorage(name, value);
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            removeLocalStorage(name);
          }
        },
      },
    }
  )
); 

// Exportar el store para que pueda ser utilizado en otros componentes
export { useUserStore }; 