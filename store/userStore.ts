import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Expertise } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

interface UserState {
  users: User[];
  currentUser: User | null;
  
  // Acciones
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (id: string, userData: Partial<User>) => User | null;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: Role) => User[];
  getUsersByExpertise: (expertise: Expertise) => User[];
  login: (email: string, password: string) => User | null;
  logout: () => void;
}

// Crear algunos usuarios iniciales para demostración
const initialUsers: User[] = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'Sistema',
    expertise: 'Administrativo',
    role: 'Administrador',
    photoUrl: 'https://i.pravatar.cc/300?img=1',
    email: 'admin@sistema.com',
    password: bcrypt.hashSync('admin123', 10)
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      currentUser: null,
      
      addUser: (userData) => {
        const newUser = {
          ...userData,
          id: uuidv4(),
          password: bcrypt.hashSync(userData.password, 10)
        };
        
        set((state) => ({
          users: [...state.users, newUser]
        }));
        
        return newUser;
      },
      
      updateUser: (id, userData) => {
        const { users } = get();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) return null;
        
        const updatedUser = {
          ...users[userIndex],
          ...userData,
          // Si se actualiza la contraseña, la encriptamos
          ...(userData.password ? { password: bcrypt.hashSync(userData.password, 10) } : {})
        };
        
        const updatedUsers = [...users];
        updatedUsers[userIndex] = updatedUser;
        
        set({ users: updatedUsers });
        
        // Si el usuario actualizado es el usuario actual, actualizamos también currentUser
        if (get().currentUser?.id === id) {
          set({ currentUser: updatedUser });
        }
        
        return updatedUser;
      },
      
      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter(user => user.id !== id)
        }));
        
        // Si el usuario eliminado es el usuario actual, cerramos sesión
        if (get().currentUser?.id === id) {
          set({ currentUser: null });
        }
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
      
      login: (email, password) => {
        const user = get().users.find(user => user.email === email);
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
          return null;
        }
        
        set({ currentUser: user });
        return user;
      },
      
      logout: () => {
        set({ currentUser: null });
      }
    }),
    {
      name: 'user-storage',
      // Solo almacenamos los usuarios, no el usuario actual (para que tenga que iniciar sesión cada vez)
      partialize: (state) => ({ users: state.users })
    }
  )
); 