import { create } from 'zustand';
import { User, Role, Expertise } from '../types/user';
import bcrypt from 'bcryptjs';

// URL base para la API
const API_BASE_URL = 'http://localhost:3005';

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
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          console.log('No hay token de autenticación');
          set({ currentUser: null });
          return;
        }
        
        // Verificar el token con la API
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.log('Token inválido o expirado');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          set({ currentUser: null });
          return;
        }
        
        const userData = await response.json();
        console.log('Sesión restaurada para:', userData.email);
        set({ currentUser: userData });
      } catch (error) {
        console.error('Error al verificar estado de autenticación:', error);
        set({ currentUser: null });
      }
    },
    
    fetchUsers: async () => {
      try {
        set({ isLoading: true });
        
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          console.error('No hay token de autenticación para obtener usuarios');
          set({ isLoading: false });
          return;
        }
        
        // Obtener usuarios de la API
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener usuarios');
        }
        
        const users = await response.json();
        console.log(`Se obtuvieron ${users.length} usuarios de la API`);
        
        set({ users, isLoading: false });
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        set({ isLoading: false });
      }
    },
    
    getUsers: () => {
      const { users, fetchUsers } = get();
      
      // Si no hay usuarios, intentar obtenerlos de la API
      if (users.length === 0) {
        fetchUsers();
      }
      
      return users;
    },
    
    addUser: async (userData) => {
      try {
        console.log('Intentando crear usuario:', userData.email);
        
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Crear usuario en la API
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al crear usuario en la API:', errorData);
          throw new Error('Error al crear usuario en la base de datos');
        }
        
        const newUser = await response.json();
        console.log('Usuario creado en la base de datos:', newUser);
        
        // Actualizar el estado local
        set((state) => ({
          users: [...state.users, newUser]
        }));
        
        return newUser;
      } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
      }
    },
    
    updateUser: async (id, userData) => {
      try {
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Actualizar usuario en la API
        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al actualizar usuario en la API:', errorData);
          throw new Error('Error al actualizar usuario en la base de datos');
        }
        
        const updatedUser = await response.json();
        console.log('Usuario actualizado en la base de datos:', updatedUser);
        
        // Actualizar el estado local
        set((state) => ({
          users: state.users.map(user => user.id === id ? updatedUser : user),
          currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser
        }));
        
        return updatedUser;
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
      }
    },
    
    resetUserPassword: async (email, newPassword) => {
      try {
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Restablecer contraseña en la API
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email, newPassword }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al restablecer contraseña en la API:', errorData);
          throw new Error('Error al restablecer contraseña');
        }
        
        console.log('Contraseña restablecida exitosamente para:', email);
        return true;
      } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        return false;
      }
    },
    
    deleteUser: async (id) => {
      try {
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Eliminar usuario en la API
        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al eliminar usuario en la API:', errorData);
          throw new Error('Error al eliminar usuario de la base de datos');
        }
        
        console.log('Usuario eliminado de la base de datos:', id);
        
        // Actualizar el estado local
        set((state) => ({
          users: state.users.filter(user => user.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser
        }));
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
      }
    },
    
    getUserById: async (id) => {
      try {
        // Primero intentar encontrar el usuario en el estado local
        const userInState = get().users.find(user => user.id === id || user.email === id);
        if (userInState) {
          return userInState;
        }
        
        // Si no hay usuarios en el estado, intentar obtenerlos primero
        if (get().users.length === 0) {
          await get().fetchUsers();
          // Verificar nuevamente después de obtener los usuarios
          const userAfterFetch = get().users.find(user => user.id === id || user.email === id);
          if (userAfterFetch) {
            return userAfterFetch;
          }
        }
        
        // Obtener el token de autenticación
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        // Determinar si el ID parece ser un correo electrónico
        const isEmail = id.includes('@');
        const endpoint = isEmail 
          ? `${API_BASE_URL}/api/users/by-email/${encodeURIComponent(id)}`
          : `${API_BASE_URL}/api/users/${id}`;
        
        // Si no se encuentra, obtenerlo de la API
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error(`Usuario no encontrado: ${id}`);
          return undefined;
        }
        
        const user = await response.json();
        
        // Actualizar el estado local con el usuario obtenido
        set((state) => ({
          users: [...state.users.filter(u => u.id !== user.id && u.email !== user.email), user]
        }));
        
        return user;
      } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        // En caso de error, devolver un objeto de usuario temporal para evitar errores en la UI
        if (id.includes('@')) {
          // Si parece ser un correo electrónico, crear un usuario temporal con ese correo
          const tempUser = {
            id: 'temp-' + Date.now(),
            email: id,
            firstName: id.split('@')[0],
            lastName: '',
            role: 'Usuario' as Role,
            expertise: 'General' as Expertise,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return tempUser;
        }
        return undefined;
      }
    },
    
    getUsersByRole: (role) => {
      return get().users.filter(user => user.role === role);
    },
    
    getUsersByExpertise: (expertise) => {
      return get().users.filter(user => user.expertise === expertise);
    },
    
    login: async (email, password) => {
      try {
        // Iniciar sesión a través de la API
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          console.log('Credenciales inválidas para:', email);
          return null;
        }
        
        const userData = await response.json();
        console.log('Login exitoso para usuario:', email);
        
        // Guardar el token en localStorage para mantener la sesión
        if (typeof window !== 'undefined' && userData.token) {
          localStorage.setItem('auth_token', userData.token);
        }
        
        // Actualizar el estado
        set({ currentUser: userData });
        
        return userData;
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return null;
      }
    },
    
    logout: () => {
      // Eliminar el token de localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      
      // Actualizar el estado
      set({ currentUser: null });
    }
  };
});

// Exportar el store para que pueda ser utilizado en otros componentes
export { useUserStore };