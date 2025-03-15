import { User } from './user';

// Información extendida del personal
export interface PersonalInfo {
  userId: string;
  fechaNacimiento: string;
  dni: string;
  domicilio: string;
  celular: string;
  telefonoAlternativo: string;
  email: string;
  dependencia: string;
  telefonoDependencia: string;
  direccionDependencia: string;
  registroAutomotor: boolean;
  grupoSanguineo: string;
}

// Fracción de licencia
export interface FraccionLicencia {
  dias: number;
  desde: string;
  hasta: string;
  resto: number;
}

// Licencia de personal
export interface Licencia {
  id: string;
  userId: string;
  area: string;
  fechaAlta: string;
  diasTotales: number;
  fracciones: FraccionLicencia[];
}

// Documento de interés
export interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'PDF' | 'WORD' | 'EXCEL' | 'OTRO';
  url: string;
  fechaSubida: Date;
  subidoPor: string; // ID del usuario
  tamaño: number; // en bytes
  attachmentId?: string; // ID del attachment en la base de datos (opcional)
}

// Estado de la administración
export interface AdminState {
  personalInfo: PersonalInfo[];
  licencias: Licencia[];
  documentos: Documento[];
  
  // Acciones para personal
  addPersonalInfo: (info: Omit<PersonalInfo, 'id'>) => void;
  updatePersonalInfo: (userId: string, info: Partial<PersonalInfo>) => void;
  getPersonalInfoByUserId: (userId: string) => PersonalInfo | undefined;
  
  // Acciones para licencias
  addLicencia: (licencia: Omit<Licencia, 'id'>) => Licencia;
  updateLicencia: (id: string, licencia: Partial<Licencia>) => Licencia | null;
  deleteLicencia: (id: string) => void;
  getLicenciasByUserId: (userId: string) => Licencia[];
  
  // Acciones para documentos
  addDocumento: (documento: Omit<Documento, 'id' | 'fechaSubida'>) => Documento;
  updateDocumento: (id: string, documento: Partial<Documento>) => Documento | null;
  deleteDocumento: (id: string) => void;
  getDocumentosByUserId: (userId: string) => Documento[];
} 