import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Expertise } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

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
    id: '1',
    firstName: 'Ivan',
    lastName: 'Zarate',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: '',
    email: 'ivan.zarate@minseg.gob.ar',
    password: bcrypt.hashSync('Vortex733-', 10)
  },
  {
    id: '2',
    firstName: 'Gestor',
    lastName: 'Proyectos',
    expertise: 'Tecnico',
    role: 'Gestor',
    photoUrl: 'https://i.pravatar.cc/300?img=2',
    email: 'gestor@sistema.com',
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
    const serializedState = JSON.stringify({
      state: {
        users: state.users,
        currentUser: state.currentUser
      },
      version: 1
    });
    localStorage.setItem('user-storage', serializedState);
    console.log('Estado guardado en localStorage:', state.users.length, 'usuarios');
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Función para cargar desde localStorage manualmente
const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    const serializedState = localStorage.getItem('user-storage');
    if (!serializedState) return null;
    
    const parsed = JSON.parse(serializedState);
    console.log('Estado cargado desde localStorage:', 
      parsed?.state?.users?.length || 0, 'usuarios');
    return parsed.state;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
  }
};

// Intentar cargar el estado inicial desde localStorage
const savedState = loadFromLocalStorage();

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: savedState?.users || initialUsers,
      currentUser: savedState?.currentUser || null,
      
      getUsers: () => {
        return get().users;
      },
      
      addUser: async (userData) => {
        try {
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
            console.log('Usuario creado:', newUser.email);
            console.log('Total usuarios:', updatedUsers.length);
            
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
      
      getUserById: (id) => {
        return get().users.find(user => user.id === id);
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
    }),
    {
      name: 'user-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch (error) {
            console.error('Error al leer del storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error al guardar en storage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error al eliminar del storage:', error);
          }
        }
      }
    }
  )
); 