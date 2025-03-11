export type Expertise = 'Administrativo' | 'Tecnico' | 'Legal';

export type Role = 'Administrador' | 'Gestor' | 'Usuario';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  expertise: Expertise;
  role: Role;
  photoUrl: string;
  email: string;
  password: string; // En una aplicación real, nunca almacenaríamos contraseñas en texto plano
} 