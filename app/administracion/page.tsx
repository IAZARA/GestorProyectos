'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { useAdminStore } from '../../store/adminStore';
import ProtectedRoute from '../components/ProtectedRoute';
import PersonalModal from './components/PersonalModal';
import LicenciaModal from './components/LicenciaModal';
import DocumentoModal from './components/DocumentoModal';
import { 
  Users, 
  Calendar, 
  FileText, 
  ChevronLeft, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit, 
  FileIcon, 
  File, 
  FileSpreadsheet, 
  Upload
} from 'lucide-react';
import { PersonalInfo, Licencia, Documento } from '../../types/admin';

export default function AdministracionPage() {
  const router = useRouter();
  const { users, currentUser } = useUserStore();
  const { 
    personalInfo, 
    licencias, 
    documentos, 
    addPersonalInfo, 
    updatePersonalInfo,
    addLicencia,
    updateLicencia,
    deleteLicencia,
    addDocumento,
    deleteDocumento
  } = useAdminStore();
  
  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState<'personal' | 'licencias' | 'documentos'>('personal');
  
  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para modales
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showLicenciaModal, setShowLicenciaModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Verificar si el usuario puede editar
  const canEdit = () => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'Administrador' || 
      currentUser.role === 'Gestor' || 
      currentUser.especialidad === 'Administracion'
    );
  };
  
  // Verificar si el usuario puede ver la sección de personal
  const canViewPersonal = () => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'Administrador' || 
      currentUser.role === 'Gestor' || 
      currentUser.especialidad === 'Administracion'
    );
  };
  
  // Filtrar usuarios según término de búsqueda
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Filtrar licencias según término de búsqueda
  const filteredLicencias = licencias.filter(licencia => {
    const user = users.find(u => u.id === licencia.userId);
    if (!user) return false;
    
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           licencia.area.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Filtrar documentos según término de búsqueda
  const filteredDocumentos = documentos.filter(doc => {
    return doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
           doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    // Asegurarse de que fechaSubida sea un objeto Date antes de llamar a getTime()
    const fechaA = a.fechaSubida instanceof Date ? a.fechaSubida : new Date(a.fechaSubida);
    const fechaB = b.fechaSubida instanceof Date ? b.fechaSubida : new Date(b.fechaSubida);
    return fechaB.getTime() - fechaA.getTime(); // Ordenar por fecha descendente
  });
  
  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Obtener icono según tipo de documento
  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'PDF':
        return <FileText className="text-red-600" size={24} />;
      case 'WORD':
        return <File className="text-blue-600" size={24} />;
      case 'EXCEL':
        return <FileSpreadsheet className="text-green-600" size={24} />;
      default:
        return <FileIcon className="text-gray-600" size={24} />;
    }
  };
  
  // Sincronizar licencias con el calendario al cargar la página
  useEffect(() => {
    // Importar dinámicamente para evitar problemas de referencia circular
    const syncLicenciasWithCalendar = async () => {
      try {
        // Obtener el store del calendario
        const { useCalendarStore } = await import('../../store/calendarStore');
        const calendarStore = useCalendarStore.getState();
        
        // Eliminar eventos de licencia existentes
        const licenseEvents = calendarStore.events.filter(event => event.type === 'license');
        licenseEvents.forEach(event => {
          calendarStore.deleteEvent(event.id);
        });
        
        // Crear eventos para cada licencia
        licencias.forEach(licencia => {
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
                const user = users.find(u => u.id === licencia.userId);
                const userName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';
                
                calendarStore.addEvent({
                  title: `Licencia de ${userName}`,
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
        });
      } catch (error) {
        console.error('Error al sincronizar licencias con el calendario:', error);
      }
    };
    
    syncLicenciasWithCalendar();
  }, [licencias, users]);
  
  // Renderizar pestaña de personal
  const renderPersonalTab = () => {
    if (!canViewPersonal()) {
      return (
        <div className="py-20 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">Acceso Restringido</h3>
            <p className="text-yellow-700">
              Esta sección está reservada para la administración.
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Solo los administradores, gestores y personal de administración pueden acceder a esta información.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Personal de la Dirección</h2>
            {canEdit() && (
              <p className="text-sm text-gray-500 mt-1">
                Puedes agregar nueva información o editar la existente usando los botones correspondientes.
              </p>
            )}
          </div>
          {canEdit() && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowPersonalModal(true);
              }}
              className="bg-[#2d2c55] text-white px-3 py-1 rounded text-sm flex items-center hover:bg-opacity-90"
            >
              <Plus size={16} className="mr-1" />
              Agregar información
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre y Apellido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Nacimiento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  D.N.I. / CUIT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domicilio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celular
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tel. Alternativo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-mail
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dependencia
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tel. Dependencia
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección Dependencia
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro Automotor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo Sanguíneo
                </th>
                {canEdit() && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const info = personalInfo.find(p => p.userId === user.id);
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.fechaNacimiento ? new Date(info.fechaNacimiento).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.dni || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.domicilio || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.celular || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.telefonoAlternativo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.email || user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.dependencia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.telefonoDependencia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.direccionDependencia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.registroAutomotor ? 'Sí' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.grupoSanguineo || '-'}
                    </td>
                    {canEdit() && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setEditingItem({
                              userId: user.id,
                              ...info
                            });
                            setShowPersonalModal(true);
                          }}
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-1.5 rounded flex items-center"
                          title="Editar información personal"
                        >
                          <Edit size={16} />
                          <span className="ml-1 hidden sm:inline">Editar</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Renderizar pestaña de licencias
  const renderLicenciasTab = () => {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Licencias del Personal</h2>
            {canEdit() && (
              <p className="text-sm text-gray-500 mt-1">
                Puedes agregar nuevas licencias o modificar las existentes usando los botones de edición.
              </p>
            )}
          </div>
          {canEdit() && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowLicenciaModal(true);
              }}
              className="bg-[#2d2c55] text-white px-3 py-1 rounded text-sm flex items-center hover:bg-opacity-90"
            >
              <Plus size={16} className="mr-1" />
              Agregar licencia
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellido y Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  D.N.I.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Alta
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Totales
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>
                  Primera Fracción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>
                  Segunda Fracción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={4}>
                  Tercera Fracción
                </th>
                {canEdit() && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
              <tr className="bg-gray-100">
                <th colSpan={5}></th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saca
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desde
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hasta
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resto
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saca
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desde
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hasta
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resto
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saca
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desde
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hasta
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resto
                </th>
                {canEdit() && <th></th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicencias.map(licencia => {
                const user = users.find(u => u.id === licencia.userId);
                const info = personalInfo.find(p => p.userId === licencia.userId);
                
                return (
                  <tr key={licencia.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user ? `${user.lastName}, ${user.firstName}` : 'Usuario desconocido'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {info?.dni || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fechaAlta ? new Date(licencia.fechaAlta).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.diasTotales}
                    </td>
                    
                    {/* Primera fracción */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[0]?.dias || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[0]?.desde ? new Date(licencia.fracciones[0].desde).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[0]?.hasta ? new Date(licencia.fracciones[0].hasta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[0]?.resto || '-'}
                    </td>
                    
                    {/* Segunda fracción */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[1]?.dias || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[1]?.desde ? new Date(licencia.fracciones[1].desde).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[1]?.hasta ? new Date(licencia.fracciones[1].hasta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[1]?.resto || '-'}
                    </td>
                    
                    {/* Tercera fracción */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[2]?.dias || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[2]?.desde ? new Date(licencia.fracciones[2].desde).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[2]?.hasta ? new Date(licencia.fracciones[2].hasta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licencia.fracciones[2]?.resto || '-'}
                    </td>
                    
                    {canEdit() && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(licencia);
                              setShowLicenciaModal(true);
                            }}
                            className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-1.5 rounded flex items-center"
                            title="Editar licencia"
                          >
                            <Edit size={16} />
                            <span className="ml-1 hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() => deleteLicencia(licencia.id)}
                            className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded flex items-center"
                            title="Eliminar licencia"
                          >
                            <Trash2 size={16} />
                            <span className="ml-1 hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Renderizar pestaña de documentos
  const renderDocumentosTab = () => {
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Documentos de Interés</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowDocumentoModal(true);
            }}
            className="bg-[#2d2c55] text-white px-3 py-1 rounded text-sm flex items-center hover:bg-opacity-90"
          >
            <Upload size={16} className="mr-1" />
            Subir documento
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocumentos.map(doc => {
            const uploader = users.find(u => u.id === doc.subidoPor);
            
            return (
              <div key={doc.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex items-start mb-3">
                  {getDocumentIcon(doc.tipo)}
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-900">{doc.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-1">{doc.descripcion}</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  <p>Subido por: {uploader ? `${uploader.firstName} ${uploader.lastName}` : 'Usuario desconocido'}</p>
                  <p>Fecha: {(doc.fechaSubida instanceof Date ? doc.fechaSubida : new Date(doc.fechaSubida)).toLocaleDateString('es-ES')}</p>
                  <p>Tamaño: {formatFileSize(doc.tamaño)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <Download size={14} className="mr-1" />
                    Descargar
                  </a>
                  
                  {(currentUser?.id === doc.subidoPor || canEdit()) && (
                    <button
                      onClick={() => deleteDocumento(doc.id)}
                      className="text-red-600 hover:text-red-800 flex items-center text-sm"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredDocumentos.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No hay documentos disponibles</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Administración de la Dirección</h1>
              <p className="text-gray-500 mt-1">Gestión del personal, licencias y documentos</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#2d2c55] hover:text-opacity-80 flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" />
              Volver al dashboard
            </button>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, área o documento..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Pestañas */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-[#2d2c55] text-[#2d2c55]'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Personal
              </button>
              <button
                onClick={() => setActiveTab('licencias')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'licencias'
                    ? 'border-b-2 border-[#2d2c55] text-[#2d2c55]'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar size={16} className="inline mr-2" />
                Licencias
              </button>
              <button
                onClick={() => setActiveTab('documentos')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'documentos'
                    ? 'border-b-2 border-[#2d2c55] text-[#2d2c55]'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Documentos
              </button>
            </nav>
          </div>
          
          {/* Contenido de las pestañas */}
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'licencias' && renderLicenciasTab()}
            {activeTab === 'documentos' && renderDocumentosTab()}
          </div>
          
          {/* Modales */}
          <PersonalModal 
            isOpen={showPersonalModal} 
            onClose={() => setShowPersonalModal(false)} 
            editingItem={editingItem}
          />
          
          <LicenciaModal 
            isOpen={showLicenciaModal} 
            onClose={() => setShowLicenciaModal(false)} 
            editingItem={editingItem}
          />
          
          <DocumentoModal 
            isOpen={showDocumentoModal} 
            onClose={() => setShowDocumentoModal(false)} 
          />
        </div>
      </div>
    </ProtectedRoute>
  );
} 