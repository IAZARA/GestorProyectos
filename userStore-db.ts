import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Expertise } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../lib/localStorage';
import axios from 'axios';

// Versión del store para detectar cambios en la estructura
const STORE_VERSION = '1.0.0';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  storeVersion: string;
  
  // Acciones
  fetchUsers: () => Promise<void>;
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
  clearLocalStorage: () => void;
}

// URL de la API interna para obtener usuarios
const API_URL = '/api/users';

// Función para guardar en localStorage manualmente
const saveToLocalStorage = (state: any) => {
  try {
    setLocalStorage('user-storage', {
      ...state,
      storeVersion: STORE_VERSION
    });
    console.log('Estado guardado en localStorage');
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Función para cargar desde localStorage
const loadFromLocalStorage = (): { users: User[], currentUser: User | null, storeVersion: string } | null => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return { users: [], currentUser: null, storeVersion: STORE_VERSION };
    }
    
    // Obtener solo el currentUser de localStorage
    const savedState = getLocalStorage('user-storage');
    
    // Verificar si la versión del store ha cambiado
    if (savedState?.storeVersion !== STORE_VERSION) {
      console.log('Versión del store ha cambiado, limpiando localStorage');
      removeLocalStorage('user-storage');
      return { users: [], currentUser: null, storeVersion: STORE_VERSION };
    }
    
    return {
      users: [], // Inicialmente vacío, se cargarán desde la API
      currentUser: savedState?.currentUser || null,
      storeVersion: STORE_VERSION
    };
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return { users: [], currentUser: null, storeVersion: STORE_VERSION };
  }
};

// Crear el store
const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      // Cargar el estado inicial
      const savedState = typeof window !== 'undefined' ? loadFromLocalStorage() : null;
      
      return {
        users: savedState?.users || [],
        currentUser: savedState?.currentUser || null,
        isLoading: false,
        error: null,
        storeVersion: STORE_VERSION,
        
        // Función para obtener usuarios de la API
        fetchUsers: async () => {
          try {
            set({ isLoading: true, error: null });
            console.log('Obteniendo usuarios de la API...');
            
            const response = await axios.get(API_URL);
            const apiUsers = response.data;
            
            console.log(`Se obtuvieron ${apiUsers.length} usuarios de la API`);
            
            set({ users: apiUsers, isLoading: false });
          } catch (error) {
            console.error('Error al obtener usuarios de la API:', error);
            set({ 
              error: 'Error al obtener usuarios de la API', 
              isLoading: false,
              users: [] // No usar usuarios iniciales como fallback
            });
          }
        },
        
        getUsers: () => {
          const { users, fetchUsers } = get();
          
          // Si no hay usuarios, intentar obtenerlos de la API
          if (users.length === 0) {
            console.log('No hay usuarios en el store, obteniendo de la API...');
            fetchUsers();
          }
          
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
            
            // Llamar a la API para crear el usuario en la base de datos
            const response = await axios.post(API_URL, newUser);
            const createdUser = response.data;
            
            set((state) => {
              const updatedUsers = [...state.users, createdUser];
              console.log('Usuario creado:', createdUser.email);
              
              // Guardar manualmente en localStorage solo el usuario actual
              setTimeout(() => saveToLocalStorage({
                users: [],
                currentUser: state.currentUser
              }), 0);
              
              return { users: updatedUsers };
            });
            
            return createdUser;
          } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
          }
        },
        
        updateUser: async (id, userData) => {
          try {
            // Llamar a la API para actualizar el usuario en la base de datos
            const response = await axios.put(`${API_URL}/${id}`, userData);
            const updatedUser = response.data;
            
            set((state) => {
              const updatedUsers = state.users.map(user => 
                user.id === id ? updatedUser : user
              );
              
              // Guardar manualmente en localStorage solo el usuario actual
              setTimeout(() => saveToLocalStorage({
                users: [],
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
        
        deleteUser: async (id) => {
          try {
            // Llamar a la API para eliminar el usuario en la base de datos
            await axios.delete(`${API_URL}/${id}`);
            
            set((state) => {
              const updatedUsers = state.users.filter(user => user.id !== id);
              const updatedCurrentUser = state.currentUser?.id === id ? null : state.currentUser;
              
              // Guardar manualmente en localStorage solo el usuario actual
              setTimeout(() => saveToLocalStorage({
                users: [],
                currentUser: updatedCurrentUser
              }), 0);
              
              return {
                users: updatedUsers,
                ...(state.currentUser?.id === id ? { currentUser: null } : {})
              };
            });
          } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
          }
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
            // Asegurarse de que tenemos los usuarios más recientes
            await get().fetchUsers();
            
            // Llamar a la API para iniciar sesión
            const response = await axios.post('/api/auth/login', { email, password });
            const user = response.data;
            
            if (!user) {
              console.log('Usuario no encontrado o contraseña incorrecta:', email);
              return null;
            }
            
            console.log('Inicio de sesión exitoso para:', email);
            
            set((state) => {
              // Guardar manualmente en localStorage solo el usuario actual
              setTimeout(() => saveToLocalStorage({
                users: [],
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
              users: [],
              currentUser: null
            }), 0);
            
            return { currentUser: null };
          });
        },
        
        resetUserPassword: async (email: string, newPassword: string) => {
          try {
            // Llamar a la API para restablecer la contraseña
            const response = await axios.post('/api/auth/reset-password', { email, newPassword });
            const success = response.data.success;
            
            if (success) {
              // Actualizar el usuario en el store si es el usuario actual
              const { users, currentUser } = get();
              const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
              
              if (userIndex !== -1) {
                const updatedUser = { ...users[userIndex] };
                const updatedUsers = [...users];
                updatedUsers[userIndex] = updatedUser;
                
                set((state) => {
                  // Guardar manualmente en localStorage
                  setTimeout(() => saveToLocalStorage({
                    users: [],
                    currentUser: state.currentUser?.id === updatedUser.id ? updatedUser : state.currentUser
                  }), 0);
                  
                  return { 
                    users: updatedUsers,
                    ...(state.currentUser?.id === updatedUser.id ? { currentUser: updatedUser } : {})
                  };
                });
              }
              
              console.log('Contraseña restablecida para:', email);
            }
            
            return success;
          } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            return false;
          }
        },
        
        clearLocalStorage: () => {
          try {
            removeLocalStorage('user-storage');
            console.log('localStorage limpiado correctamente');
            
            // Mantener el usuario actual pero limpiar la lista de usuarios
            set((state) => ({
              users: [],
              currentUser: state.currentUser,
              storeVersion: STORE_VERSION
            }));
            
            // Recargar los usuarios desde la API
            get().fetchUsers();
          } catch (error) {
            console.error('Error al limpiar localStorage:', error);
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

// Inicializar la carga de usuarios cuando se importa el store
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente
  setTimeout(() => {
    const { fetchUsers } = useUserStore.getState();
    fetchUsers().catch(error => console.error('Error al cargar usuarios iniciales:', error));
  }, 0);
}

export { useUserStore }; 