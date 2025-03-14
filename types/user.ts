export type Expertise = 'Administrativo' | 'Tecnico' | 'Legal';

export type Role = 'Administrador' | 'Gestor' | 'Usuario';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  expertise: Expertise;
  role: Role;
  photoUrl?: string;
  email: string;
  password?: string; // Hacemos la contraseña opcional para que sea compatible con la respuesta de la API
  especialidad?: string; // Nueva propiedad para la especialidad del usuario
  token?: string; // Añadimos el token como propiedad opcional
} 