import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Expertise } from '../types/user';
import { login as apiLogin, logout as apiLogout, getCurrentUser, getUsers as apiGetUsers, getProjects, getUserById as apiGetUserById } from '../lib/api';
import { enhancedStorage } from '../lib/localStorage';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  token: string | null;
  
  // Acciones
  fetchUsers: () => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | undefined>;
  getUsersByRole: (role: Role) => User[];
  getUsersByExpertise: (expertise: Expertise) => User[];
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  resetUserPassword: (email: string, newPassword: string) => Promise<boolean>;
  getUsers: () => User[];
  checkAuthState: () => Promise<void>;
  setToken: (token: string | null) => void;
}

// Función auxiliar para sincronizar explícitamente el store
export const syncUserStore = () => {
  const state = useUserStore.getState();
  useUserStore.setState({ ...state });
  console.log("[UserStore] Sincronización forzada");
};

// Crear el store
const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      isLoading: false,
      token: null,
    
    setToken: (token: string | null) => {
      set({ token });
    },
    
    checkAuthState: async () => {
      try {
        const token = get().token;
        
        if (!token) {
          console.log('No hay token de autenticación');
          set({ currentUser: null });
          return;
        }
        
        console.log('Token encontrado, verificando autenticación...');
        
        try {
          // Obtener los datos del usuario actual usando la API
          const userData = await getCurrentUser();
          
          if (userData) {
            console.log('Usuario autenticado:', userData);
            set({ currentUser: userData });
            
            // Cargar proyectos del usuario automáticamente
            try {
              console.log('Cargando proyectos para el usuario...');
              const projects = await getProjects();
              console.log(`Se cargaron ${projects.length} proyectos`);
            } catch (projectError) {
              console.error('Error al cargar proyectos:', projectError);
            }
          } else {
            console.log('Token inválido o expirado');
            set({ currentUser: null, token: null });
          }
        } catch (apiError) {
          console.error('Error al verificar autenticación con la API:', apiError);
          set({ currentUser: null, token: null });
        }
      } catch (error) {
        console.error('Error al verificar el estado de autenticación:', error);
        set({ currentUser: null, token: null });
      }
    },
    
    fetchUsers: async () => {
      try {
        // Evitar múltiples llamadas simultáneas
        if (get().isLoading) {
          console.log('Ya hay una carga de usuarios en progreso, esperando...');
          return;
        }
        
        set({ isLoading: true });
        console.log('Iniciando carga de usuarios...');
        
        // Limitar el tiempo de espera para evitar bloqueos
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Tiempo de espera agotado')), 10000);
        });
        
        // Competencia entre la carga de datos y el timeout
        const usersData = await Promise.race([
          apiGetUsers(),
          timeoutPromise
        ]) as User[];
        
        if (usersData) {
          console.log(`Cargados ${usersData.length} usuarios correctamente`);
          set({ users: usersData, isLoading: false });
        } else {
          console.warn('No se obtuvieron datos de usuarios');
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        set({ isLoading: false });
      }
    },
    
    getUsers: () => {
      return get().users;
    },
    
    addUser: async (userData) => {
      const { users } = get();
      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        ...userData
      };
      set({ users: [...users, newUser] });
      return newUser;
    },
    
    updateUser: async (id, userData) => {
      const { users } = get();
      const userIndex = users.findIndex(user => user.id === id);
      
      if (userIndex === -1) {
        return null;
      }
      
      const updatedUser = { ...users[userIndex], ...userData };
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      
      set({ users: updatedUsers });
      
      const { currentUser } = get();
      if (currentUser && currentUser.id === id) {
        set({ currentUser: updatedUser });
      }
      
      return updatedUser;
    },
    
    resetUserPassword: async (email, newPassword) => {
      const { users } = get();
      const userIndex = users.findIndex(user => user.email === email);
      
      if (userIndex === -1) {
        return false;
      }
      
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
      
      set({ users: updatedUsers });
      return true;
    },
    
    deleteUser: async (id) => {
      const { users, currentUser } = get();
      
      if (currentUser && currentUser.id === id) {
        throw new Error('No puedes eliminar tu propio usuario mientras estás conectado');
      }
      
      const updatedUsers = users.filter(user => user.id !== id);
      set({ users: updatedUsers });
    },
    
    getUserById: async (id) => {
      if (!id) {
        console.error("getUserById: ID es null o undefined");
        return undefined;
      }
      console.log(`getUserById: Buscando usuario con ID ${id}`);
      const { users } = get();
      
      // Primero buscar en el cache local
      const localUser = users.find(user => user.id === id);
      if (localUser) {
        console.log(`getUserById: Usuario encontrado localmente: ${localUser.firstName} ${localUser.lastName}`);
        return localUser;
      }
      
      // Si no se encuentra localmente, intentar cargar todos los usuarios y buscar de nuevo
      if (users.length === 0) {
        console.log("getUserById: No hay usuarios en caché, intentando cargar todos");
        try {
          await get().fetchUsers();
          
          // Buscar en la lista actualizada
          const freshUsers = get().users;
          const freshUser = freshUsers.find(user => user.id === id);
          if (freshUser) {
            console.log(`getUserById: Usuario encontrado después de recargar: ${freshUser.firstName} ${freshUser.lastName}`);
            return freshUser;
          }
        } catch (error) {
          console.error("getUserById: Error al cargar usuarios:", error);
        }
      }
      
      // Si aún no se encuentra, intentar obtenerlo directamente de la API
      console.log(`getUserById: Intentando obtener usuario ${id} directamente de la API`);
      try {
        const apiUser = await apiGetUserById(id);
        if (apiUser) {
          console.log(`getUserById: Usuario obtenido de la API: ${apiUser.firstName} ${apiUser.lastName}`);
          
          // Actualizar el caché local con este usuario
          set(state => ({
            users: [...state.users.filter(u => u.id !== id), apiUser]
          }));
          
          return apiUser;
        }
      } catch (apiError) {
        console.error(`getUserById: Error al obtener usuario ${id} de la API:`, apiError);
      }
      
      console.log(`getUserById: No se encontró el usuario con ID ${id} en ninguna fuente`);
      return undefined;
    },
    
    getUsersByRole: (role) => {
      const { users } = get();
      return users.filter(user => user.role === role);
    },
    
    getUsersByExpertise: (expertise) => {
      const { users } = get();
      return users.filter(user => user.expertise === expertise);
    },
    
    login: async (email, password) => {
      try {
        set({ isLoading: true });
        console.log(`Intentando iniciar sesión con: ${email}`);
        
        const userData = await apiLogin(email, password);
        
        if (userData && userData.token) {
          console.log('Login exitoso:', userData);
          set({ 
            currentUser: userData, 
            isLoading: false,
            token: userData.token 
          });
          return userData;
        }
        
        console.log('Login fallido: datos de usuario inválidos');
        set({ isLoading: false });
        return null;
        
      } catch (error) {
        console.error('Error durante el login:', error);
        set({ isLoading: false });
        return null;
      }
    },
    
    logout: () => {
      apiLogout();
      set({ currentUser: null, token: null });
    }
  }),
  {
    name: 'user-storage',
    partialize: (state) => ({
      users: state.users,
      currentUser: state.currentUser,
      token: state.token
    }),
    onRehydrateStorage: () => (state) => {
      console.log('[UserStore] Rehidratado con', state?.users?.length || 0, 'usuarios');
      // Forzar sincronización después de rehidratar
      setTimeout(() => {
        syncUserStore();
      }, 500);
    },
    // Usar el storage mejorado
    storage: enhancedStorage
  }
));

export { useUserStore };