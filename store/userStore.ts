import { create } from 'zustand';
import { User, Role, Expertise } from '../types/user';
import { login as apiLogin, logout as apiLogout, getCurrentUser, getUsers as apiGetUsers, getProjects } from '../lib/api';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  
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
}

// Crear el store
const useUserStore = create<UserState>()((set, get) => {
  return {
    users: [],
    currentUser: null,
    isLoading: false,
    
    checkAuthState: async () => {
      try {
        // Verificar si hay un token en localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
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
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
            }
            set({ currentUser: null });
          }
        } catch (apiError) {
          console.error('Error al verificar autenticación con la API:', apiError);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          set({ currentUser: null });
        }
      } catch (error) {
        console.error('Error al verificar el estado de autenticación:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ currentUser: null });
      }
    },
    
    fetchUsers: async () => {
      try {
        set({ isLoading: true });
        
        // Obtener usuarios usando la API
        const usersData = await apiGetUsers();
        
        if (usersData) {
          set({ users: usersData, isLoading: false });
        } else {
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
      // Implementación actual (mantener por ahora)
      const { users } = get();
      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        ...userData
      };
      set({ users: [...users, newUser] });
      return newUser;
    },
    
    updateUser: async (id, userData) => {
      // Implementación actual (mantener por ahora)
      const { users } = get();
      const userIndex = users.findIndex(user => user.id === id);
      
      if (userIndex === -1) {
        return null;
      }
      
      const updatedUser = { ...users[userIndex], ...userData };
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      
      set({ users: updatedUsers });
      
      // Si el usuario actualizado es el usuario actual, actualizar también currentUser
      const { currentUser } = get();
      if (currentUser && currentUser.id === id) {
        set({ currentUser: updatedUser });
      }
      
      return updatedUser;
    },
    
    resetUserPassword: async (email, newPassword) => {
      // Implementación actual (mantener por ahora)
      const { users } = get();
      const userIndex = users.findIndex(user => user.email === email);
      
      if (userIndex === -1) {
        return false;
      }
      
      // En una aplicación real, aquí se haría una llamada a la API para cambiar la contraseña
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
      
      set({ users: updatedUsers });
      return true;
    },
    
    deleteUser: async (id) => {
      // Implementación actual (mantener por ahora)
      const { users, currentUser } = get();
      
      // Verificar si el usuario a eliminar es el usuario actual
      if (currentUser && currentUser.id === id) {
        throw new Error('No puedes eliminar tu propio usuario mientras estás conectado');
      }
      
      const updatedUsers = users.filter(user => user.id !== id);
      set({ users: updatedUsers });
    },
    
    getUserById: async (id) => {
      const { users } = get();
      return users.find(user => user.id === id);
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
        
        // Usar la función de login de la API
        const userData = await apiLogin(email, password);
        
        console.log('Datos recibidos del login:', userData);
        
        if (userData && userData.token) {
          // La API devuelve directamente el usuario con el token incluido
          console.log('Login exitoso:', userData);
          set({ currentUser: userData, isLoading: false });
          
          // Cargar proyectos del usuario automáticamente después del login
          try {
            console.log('Cargando proyectos para el usuario después del login...');
            const projects = await getProjects();
            console.log(`Se cargaron ${projects.length} proyectos`);
          } catch (projectError) {
            console.error('Error al cargar proyectos después del login:', projectError);
          }
          
          return userData;
        } else {
          console.error('Error en login: No se recibieron datos de usuario');
          set({ isLoading: false });
          return null;
        }
      } catch (error) {
        console.error('Error en login:', error);
        set({ isLoading: false });
        return null;
      }
    },
    
    logout: () => {
      // Usar la función de logout de la API
      apiLogout();
      set({ currentUser: null });
    }
  };
});

// Exportar el store para que pueda ser utilizado en otros componentes
export { useUserStore };