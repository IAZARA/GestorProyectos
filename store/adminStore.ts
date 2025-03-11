import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  AdminState, 
  PersonalInfo, 
  Licencia, 
  Documento 
} from '../types/admin';
import { useCalendarStore } from './calendarStore';

// Datos iniciales de ejemplo
const initialPersonalInfo: PersonalInfo[] = [
  {
    userId: '1', // ID del administrador
    fechaNacimiento: '1973-06-13',
    dni: '23-23469032-9',
    domicilio: 'JUSTO SUAREZ 6642, C.A.B.A.',
    celular: '15-4173-5600',
    telefonoAlternativo: '',
    email: 'mscarimbolo@gmail.com',
    dependencia: 'MINISTERIO DE SEGURIDAD',
    telefonoDependencia: '5278-9800 int. 6692',
    direccionDependencia: 'Chile 760',
    registroAutomotor: true,
    grupoSanguineo: '0 +'
  }
];

const initialLicencias: Licencia[] = [
  {
    id: '1',
    userId: '1', // ID del administrador
    area: 'Dir.Nac. De Gestion B.D. de SEG.',
    fechaAlta: '',
    diasTotales: 10,
    fracciones: [
      {
        dias: 10,
        desde: '2025-01-01',
        hasta: '2025-01-10',
        resto: 0
      }
    ]
  },
  {
    id: '2',
    userId: '2', // ID de otro usuario
    area: 'Asesor Técnico',
    fechaAlta: '',
    diasTotales: 40,
    fracciones: [
      {
        dias: 20,
        desde: '2025-03-25',
        hasta: '2025-04-13',
        resto: 20
      }
    ]
  }
];

const initialDocumentos: Documento[] = [
  {
    id: '1',
    titulo: 'Manual de procedimientos',
    descripcion: 'Manual de procedimientos actualizado para la dirección',
    tipo: 'PDF',
    url: '/documentos/manual_procedimientos.pdf',
    fechaSubida: new Date('2023-12-15'),
    subidoPor: '1', // ID del administrador
    tamaño: 2500000 // 2.5 MB
  },
  {
    id: '2',
    titulo: 'Planilla de asistencia',
    descripcion: 'Planilla para registrar la asistencia del personal',
    tipo: 'EXCEL',
    url: '/documentos/planilla_asistencia.xlsx',
    fechaSubida: new Date('2024-01-10'),
    subidoPor: '2', // ID de otro usuario
    tamaño: 150000 // 150 KB
  }
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      personalInfo: initialPersonalInfo,
      licencias: initialLicencias,
      documentos: initialDocumentos,
      
      // Acciones para personal
      addPersonalInfo: (info) => {
        set((state) => ({
          personalInfo: [...state.personalInfo, info]
        }));
      },
      
      updatePersonalInfo: (userId, info) => {
        set((state) => ({
          personalInfo: state.personalInfo.map(item => 
            item.userId === userId ? { ...item, ...info } : item
          )
        }));
      },
      
      getPersonalInfoByUserId: (userId) => {
        return get().personalInfo.find(info => info.userId === userId);
      },
      
      // Acciones para licencias
      addLicencia: (licencia) => {
        const newLicencia = {
          ...licencia,
          id: uuidv4()
        };
        
        set((state) => ({
          licencias: [...state.licencias, newLicencia]
        }));
        
        // Sincronizar con el calendario
        syncLicenciaWithCalendar(newLicencia);
        
        return newLicencia;
      },
      
      updateLicencia: (id, licencia) => {
        const { licencias } = get();
        const licenciaIndex = licencias.findIndex(l => l.id === id);
        
        if (licenciaIndex === -1) return null;
        
        const updatedLicencia = {
          ...licencias[licenciaIndex],
          ...licencia
        };
        
        const updatedLicencias = [...licencias];
        updatedLicencias[licenciaIndex] = updatedLicencia;
        
        set({ licencias: updatedLicencias });
        
        // Sincronizar con el calendario
        syncLicenciaWithCalendar(updatedLicencia);
        
        return updatedLicencia;
      },
      
      deleteLicencia: (id) => {
        const { licencias } = get();
        const licencia = licencias.find(l => l.id === id);
        
        if (licencia) {
          // Eliminar eventos de calendario relacionados
          deleteLicenciaFromCalendar(licencia);
        }
        
        set((state) => ({
          licencias: state.licencias.filter(l => l.id !== id)
        }));
      },
      
      getLicenciasByUserId: (userId) => {
        return get().licencias.filter(l => l.userId === userId);
      },
      
      // Acciones para documentos
      addDocumento: (documento) => {
        const newDocumento = {
          ...documento,
          id: uuidv4(),
          fechaSubida: new Date()
        };
        
        set((state) => ({
          documentos: [...state.documentos, newDocumento]
        }));
        
        return newDocumento;
      },
      
      updateDocumento: (id, documento) => {
        const { documentos } = get();
        const documentoIndex = documentos.findIndex(d => d.id === id);
        
        if (documentoIndex === -1) return null;
        
        const updatedDocumento = {
          ...documentos[documentoIndex],
          ...documento
        };
        
        const updatedDocumentos = [...documentos];
        updatedDocumentos[documentoIndex] = updatedDocumento;
        
        set({ documentos: updatedDocumentos });
        
        return updatedDocumento;
      },
      
      deleteDocumento: (id) => {
        set((state) => ({
          documentos: state.documentos.filter(d => d.id !== id)
        }));
      },
      
      getDocumentosByUserId: (userId) => {
        return get().documentos.filter(d => d.subidoPor === userId);
      }
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ 
        personalInfo: state.personalInfo,
        licencias: state.licencias,
        documentos: state.documentos
      })
    }
  )
);

// Función para sincronizar licencias con el calendario
const syncLicenciaWithCalendar = (licencia: Licencia) => {
  const calendarStore = useCalendarStore.getState();
  const { events, addEvent, updateEvent, deleteEvent } = calendarStore;
  
  // Buscar eventos existentes para esta licencia
  const existingEvents = events.filter(
    event => event.type === 'license' && event.description.includes(`ID de licencia: ${licencia.id}`)
  );
  
  // Eliminar eventos existentes
  existingEvents.forEach(event => {
    deleteEvent(event.id);
  });
  
  // Crear eventos para cada fracción de licencia
  licencia.fracciones.forEach((fraccion, index) => {
    if (fraccion.desde && fraccion.hasta) {
      // Crear fechas de inicio y fin
      const startDate = new Date(fraccion.desde);
      const endDate = new Date(fraccion.hasta);
      
      // Establecer la hora de inicio a las 00:00:00
      startDate.setHours(0, 0, 0, 0);
      
      // Establecer la hora de fin a las 23:59:59 para que abarque todo el día
      endDate.setHours(23, 59, 59, 999);
      
      // Asegurarse de que las fechas son válidas
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const user = getUserName(licencia.userId);
        
        addEvent({
          title: `Licencia de ${user}`,
          description: `Fracción ${index + 1}: ${fraccion.dias} días\nID de licencia: ${licencia.id}`,
          startDate,
          endDate,
          createdBy: licencia.userId,
          type: 'license',
          userId: licencia.userId,
          attendees: [licencia.userId],
          attachments: [],
          color: '#f97316' // Color naranja para licencias
        });
      }
    }
  });
};

// Función para eliminar eventos de licencia del calendario
const deleteLicenciaFromCalendar = (licencia: Licencia) => {
  const calendarStore = useCalendarStore.getState();
  const { events, deleteEvent } = calendarStore;
  
  // Buscar eventos existentes para esta licencia
  const existingEvents = events.filter(
    event => event.type === 'license' && event.description.includes(`ID de licencia: ${licencia.id}`)
  );
  
  // Eliminar eventos existentes
  existingEvents.forEach(event => {
    deleteEvent(event.id);
  });
};

// Función auxiliar para obtener el nombre del usuario
const getUserName = (userId: string): string => {
  const { users } = require('./userStore').useUserStore.getState();
  const user = users.find(u => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
}; 