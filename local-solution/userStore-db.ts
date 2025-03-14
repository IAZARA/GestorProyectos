import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Definición de tipos
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  password?: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  storeVersion: string;

  // Acciones
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  getUsers: () => Promise<User[]>;
  clearLocalStorage: () => void;
}

// Funciones auxiliares para localStorage
const getLocalStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(key);
  if (value === null) return null;
  return JSON.parse(value);
};

const setLocalStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const removeLocalStorage = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

// Creación del store
const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      return {
        users: [],
        currentUser: null,
        isLoading: false,
        error: null,
        storeVersion: '1.0.0',

        // Establecer lista de usuarios
        setUsers: (users: User[]) => {
          set({ users });
        },

        // Agregar un usuario
        addUser: async (user: User) => {
          try {
            set({ isLoading: true, error: null });
            const response = await axios.post('/api/users', user);
            const newUser = response.data;
            
            set((state) => ({
              users: [...state.users, newUser],
              isLoading: false
            }));
            
            return newUser;
          } catch (error) {
            console.error('Error al agregar usuario:', error);
            set({ error: 'Error al agregar usuario', isLoading: false });
            return null;
          }
        },

        // Actualizar un usuario
        updateUser: async (id: string, userData: Partial<User>) => {
          try {
            set({ isLoading: true, error: null });
            const response = await axios.put(`/api/users/${id}`, userData);
            const updatedUser = response.data;
            
            set((state) => ({
              users: state.users.map((user) => 
                user.id === id ? { ...user, ...updatedUser } : user
              ),
              currentUser: state.currentUser?.id === id 
                ? { ...state.currentUser, ...updatedUser } 
                : state.currentUser,
              isLoading: false
            }));
            
            return updatedUser;
          } catch (error) {
            console.error('Error al actualizar usuario:', error);
            set({ error: 'Error al actualizar usuario', isLoading: false });
            return null;
          }
        },

        // Eliminar un usuario
        deleteUser: async (id: string) => {
          try {
            set({ isLoading: true, error: null });
            await axios.delete(`/api/users/${id}`);
            
            set((state) => ({
              users: state.users.filter((user) => user.id !== id),
              isLoading: false
            }));
            
            return true;
          } catch (error) {
            console.error('Error al eliminar usuario:', error);
            set({ error: 'Error al eliminar usuario', isLoading: false });
            return false;
          }
        },

        // Establecer usuario actual
        setCurrentUser: (user: User | null) => {
          set({ currentUser: user });
        },

        // Iniciar sesión
        login: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });
            const response = await axios.post('/api/auth/login', { email, password });
            const { user, token } = response.data;
            
            // Guardar el token en localStorage
            setLocalStorage('auth-token', token);
            
            // Configurar el token para futuras peticiones
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({ currentUser: user, isLoading: false });
            
            // Cargar usuarios después de iniciar sesión
            get().getUsers();
            
            return user;
          } catch (error) {
            console.error('Error al iniciar sesión:', error);
            set({ error: 'Credenciales inválidas', isLoading: false });
            return null;
          }
        },

        // Cerrar sesión
        logout: () => {
          // Eliminar el token de localStorage
          removeLocalStorage('auth-token');
          
          // Eliminar el token de las cabeceras
          delete axios.defaults.headers.common['Authorization'];
          
          set({ currentUser: null });
        },

        // Obtener usuarios desde la API
        getUsers: async () => {
          try {
            set({ isLoading: true, error: null });
            const response = await axios.get('/api/users');
            const users = response.data;
            
            set({ users, isLoading: false });
            return users;
          } catch (error) {
            console.error('Error al obtener usuarios:', error);
            set({ error: 'Error al obtener usuarios', isLoading: false });
            return [];
          }
        },

        // Limpiar localStorage
        clearLocalStorage: () => {
          try {
            removeLocalStorage('user-storage');
            console.log('localStorage de usuarios limpiado correctamente');
            
            // Mantener el usuario actual pero limpiar la lista de usuarios
            set((state) => ({
              users: [],
              currentUser: state.currentUser,
              storeVersion: '1.0.0'
            }));
            
            // Recargar los usuarios desde la API
            get().getUsers();
          } catch (error) {
            console.error('Error al limpiar localStorage de usuarios:', error);
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

// Configurar axios para incluir el token en todas las peticiones
if (typeof window !== 'undefined') {
  const token = getLocalStorage('auth-token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// Inicializar carga de usuarios
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const { currentUser, getUsers } = useUserStore.getState();
    if (currentUser) {
      getUsers();
    }
  }, 0);
}

export { useUserStore };