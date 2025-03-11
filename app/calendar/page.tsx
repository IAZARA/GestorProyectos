'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCalendarStore } from '../../store/calendarStore';
import { useUserStore } from '../../store/userStore';
import { useProjectStore } from '../../store/projectStore';
import { CalendarEvent, EventType } from '../../types/calendar';
import ProtectedRoute from '../components/ProtectedRoute';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  User, 
  Users, 
  Clock, 
  CalendarDays,
  Briefcase,
  Plane
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Componente principal del calendario
export default function CalendarPage() {
  const router = useRouter();
  const { events, addEvent, updateEvent, deleteEvent, getEventById } = useCalendarStore();
  const { currentUser, getUserById, users } = useUserStore();
  const { projects, getProjectById } = useProjectStore();
  
  // Estado para el calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Estado para el modal de evento
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    id: '',
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'meeting' as EventType,
    projectId: '',
    attendees: [] as string[],
    color: '#4f46e5'
  });
  const [isNewEvent, setIsNewEvent] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estado para el modal de detalles de evento
  const [showEventDetails, setShowEventDetails] = useState(false);
  
  // Funciones de navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Funciones para manejar eventos
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Preparar formulario para nuevo evento
    const newStartDate = new Date(date);
    newStartDate.setHours(9, 0, 0, 0);
    
    const newEndDate = new Date(date);
    newEndDate.setHours(10, 0, 0, 0);
    
    setEventFormData({
      id: '',
      title: '',
      description: '',
      startDate: newStartDate,
      endDate: newEndDate,
      type: 'meeting',
      projectId: '',
      attendees: currentUser ? [currentUser.id] : [],
      color: '#4f46e5'
    });
    
    setIsNewEvent(true);
    setShowEventModal(true);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  const handleEditEvent = () => {
    if (!selectedEvent) return;
    
    setEventFormData({
      id: selectedEvent.id,
      title: selectedEvent.title,
      description: selectedEvent.description,
      startDate: new Date(selectedEvent.startDate),
      endDate: new Date(selectedEvent.endDate),
      type: selectedEvent.type,
      projectId: selectedEvent.projectId || '',
      attendees: [...selectedEvent.attendees],
      color: selectedEvent.color || '#4f46e5'
    });
    
    setIsNewEvent(false);
    setShowEventDetails(false);
    setShowEventModal(true);
  };
  
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    deleteEvent(selectedEvent.id);
    setShowDeleteConfirm(false);
    setShowEventDetails(false);
    setSelectedEvent(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    const { value } = e.target;
    const [datePart, timePart] = value.split('T');
    
    const newDate = new Date(eventFormData[field]);
    const [year, month, day] = datePart.split('-').map(Number);
    
    if (timePart) {
      const [hours, minutes] = timePart.split(':').map(Number);
      newDate.setFullYear(year, month - 1, day);
      newDate.setHours(hours, minutes, 0, 0);
    } else {
      newDate.setFullYear(year, month - 1, day);
    }
    
    setEventFormData(prev => ({ ...prev, [field]: newDate }));
  };
  
  const handleAttendeeToggle = (userId: string) => {
    setEventFormData(prev => {
      const isSelected = prev.attendees.includes(userId);
      
      if (isSelected) {
        return {
          ...prev,
          attendees: prev.attendees.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          attendees: [...prev.attendees, userId]
        };
      }
    });
  };
  
  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNewEvent) {
      // Crear nuevo evento
      addEvent({
        title: eventFormData.title,
        description: eventFormData.description,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        createdBy: currentUser?.id || '',
        type: eventFormData.type,
        projectId: eventFormData.projectId || undefined,
        attendees: eventFormData.attendees,
        attachments: [],
        color: eventFormData.color
      });
    } else {
      // Actualizar evento existente
      updateEvent(eventFormData.id, {
        title: eventFormData.title,
        description: eventFormData.description,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        type: eventFormData.type,
        projectId: eventFormData.projectId || undefined,
        attendees: eventFormData.attendees,
        color: eventFormData.color
      });
    }
    
    setShowEventModal(false);
  };
  
  // Renderizar el calendario
  const renderCalendar = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    
    // Ajustar al primer día de la semana (domingo)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const endDate = new Date(monthEnd);
    // Ajustar al último día de la semana (sábado)
    const lastDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));
    
    const rows = [];
    let days = [];
    let day = new Date(startDate);
    
    // Encabezados de los días de la semana
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Filtrar eventos para el mes actual
    const monthEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (
        (eventStart >= startDate && eventStart <= endDate) ||
        (eventEnd >= startDate && eventEnd <= endDate) ||
        (eventStart <= startDate && eventEnd >= endDate)
      );
    });
    
    // Renderizar encabezados de días
    const dayHeaders = daysOfWeek.map(dayName => (
      <div key={dayName} className="text-center font-medium py-2 border-b">
        {dayName}
      </div>
    ));
    
    // Renderizar días
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString();
        
        // Filtrar eventos para este día
        // Incluir eventos que comienzan este día o que están en curso (para licencias)
        const dayEvents = monthEvents.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          
          // Para eventos normales, mostrar solo en el día de inicio
          if (event.type !== 'license') {
            return eventStart.getDate() === day.getDate() &&
                   eventStart.getMonth() === day.getMonth() &&
                   eventStart.getFullYear() === day.getFullYear();
          } 
          
          // Para licencias, mostrar en todos los días que abarca
          return day >= eventStart && day <= eventEnd;
        });
        
        if (dayEvents.length > 0) {
          const eventElements = dayEvents.map(event => {
            // Determinar el icono según el tipo de evento
            let icon;
            switch (event.type) {
              case 'project':
                icon = <Briefcase size={12} className="mr-1" />;
                break;
              case 'meeting':
                icon = <Users size={12} className="mr-1" />;
                break;
              case 'license':
                icon = <Plane size={12} className="mr-1" />;
                break;
              default:
                icon = <CalendarDays size={12} className="mr-1" />;
            }
            
            // Determinar la clase de estilo según el tipo de evento
            let eventClass = "px-2 py-1 rounded text-xs mb-1 truncate flex items-center";
            if (event.type === 'project') {
              eventClass += " bg-green-100 text-green-800";
            } else if (event.type === 'meeting') {
              eventClass += " bg-blue-100 text-blue-800";
            } else if (event.type === 'license') {
              // Estilo especial para licencias
              const eventStart = new Date(event.startDate);
              const eventEnd = new Date(event.endDate);
              const isFirstDay = day.getDate() === eventStart.getDate() && 
                                day.getMonth() === eventStart.getMonth() && 
                                day.getFullYear() === eventStart.getFullYear();
              const isLastDay = day.getDate() === eventEnd.getDate() && 
                                day.getMonth() === eventEnd.getMonth() && 
                                day.getFullYear() === eventEnd.getFullYear();
              
              // Estilo base para licencias - usar el color definido en el evento o el naranjo por defecto
              const bgColor = event.color || '#f97316';
              const bgColorLight = 'bg-orange-50';
              const borderColor = 'border-orange-300';
              const textColor = 'text-orange-800';
              
              eventClass = `px-2 py-1 text-xs mb-1 flex items-center border-t border-b ${borderColor} ${bgColorLight}`;
              
              // Añadir bordes laterales según la posición
              if (isFirstDay && isLastDay) {
                // Si es un evento de un solo día
                eventClass += ` rounded border-l border-r ${borderColor}`;
              } else if (isFirstDay) {
                // Si es el primer día
                eventClass += ` rounded-l-md border-l ${borderColor} pl-2`;
              } else if (isLastDay) {
                // Si es el último día
                eventClass += ` rounded-r-md border-r ${borderColor} pr-2`;
              } else {
                // Si es un día intermedio
                eventClass += " border-l-0 border-r-0";
              }
              
              // Mostrar el título completo solo en el primer día
              if (!isFirstDay) {
                return (
                  <div 
                    key={`${event.id}-${day.toISOString()}`}
                    className={eventClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    title={event.title}
                  >
                    <div className="w-full h-5 flex items-center justify-center">
                      <Plane size={10} className="text-orange-500" />
                    </div>
                  </div>
                );
              }
              
              // Para el primer día, mostrar el título e icono
              eventClass += ` ${textColor}`;
            } else {
              eventClass += " bg-gray-100 text-gray-800";
            }
            
            return (
              <div 
                key={event.id}
                className={eventClass}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
              >
                {icon}
                {event.title}
              </div>
            );
          });
          
          days.push(
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] p-1 border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${isToday ? 'bg-blue-50' : ''}`}
              onClick={() => handleDateClick(cloneDay)}
            >
              <div className="text-right">
                <span className={`inline-block w-6 h-6 text-center ${
                  isToday ? 'bg-blue-600 text-white rounded-full' : ''
                }`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {eventElements}
              </div>
            </div>
          );
        } else {
          days.push(
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] p-1 border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${isToday ? 'bg-blue-50' : ''}`}
              onClick={() => handleDateClick(cloneDay)}
            >
              <div className="text-right">
                <span className={`inline-block w-6 h-6 text-center ${
                  isToday ? 'bg-blue-600 text-white rounded-full' : ''
                }`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {/* Renderizar eventos vacíos o mensajes de ausencia de eventos */}
              </div>
            </div>
          );
        }
        
        day.setDate(day.getDate() + 1);
      }
      
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
      
      days = [];
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-xl font-semibold ml-4">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm bg-[#2d2c55] text-white rounded hover:bg-opacity-90"
            >
              Hoy
            </button>
          </div>
          <button 
            onClick={() => handleDateClick(new Date())}
            className="flex items-center bg-[#2d2c55] text-white px-3 py-1 rounded hover:bg-opacity-90"
          >
            <Plus size={16} className="mr-1" />
            Nuevo evento
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {dayHeaders}
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
          {rows}
        </div>
      </div>
    );
  };
  
  // Renderizar modal de evento
  const renderEventModal = () => {
    if (!showEventModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {isNewEvent ? 'Crear nuevo evento' : 'Editar evento'}
            </h3>
            <button
              onClick={() => setShowEventModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmitEvent}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={eventFormData.title}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={eventFormData.description}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora de inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventFormData.startDate.toISOString().slice(0, 16)}
                    onChange={(e) => handleDateChange(e, 'startDate')}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora de fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventFormData.endDate.toISOString().slice(0, 16)}
                    onChange={(e) => handleDateChange(e, 'endDate')}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de evento
                  </label>
                  <select
                    name="type"
                    value={eventFormData.type}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="meeting">Reunión</option>
                    <option value="project">Proyecto</option>
                    <option value="license">Licencia</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proyecto relacionado
                  </label>
                  <select
                    name="projectId"
                    value={eventFormData.projectId}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Ninguno</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="color"
                    value={eventFormData.color}
                    onChange={handleFormChange}
                    className="w-10 h-10 border-0 p-0"
                  />
                  <span className="text-sm text-gray-500">
                    Selecciona un color para el evento
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asistentes
                </label>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={eventFormData.attendees.includes(user.id)}
                        onChange={() => handleAttendeeToggle(user.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`user-${user.id}`} className="text-sm">
                        {user.firstName} {user.lastName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2d2c55] text-white rounded-md hover:bg-opacity-90"
              >
                {isNewEvent ? 'Crear evento' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Renderizar modal de detalles de evento
  const renderEventDetails = () => {
    if (!showEventDetails || !selectedEvent) return null;
    
    const creator = getUserById(selectedEvent.createdBy);
    const project = selectedEvent.projectId ? getProjectById(selectedEvent.projectId) : null;
    const attendeesList = selectedEvent.attendees.map(id => getUserById(id)).filter(Boolean);
    
    // Determinar el icono según el tipo de evento
    let typeIcon;
    let typeText;
    switch (selectedEvent.type) {
      case 'project':
        typeIcon = <Briefcase size={16} className="mr-2" />;
        typeText = "Proyecto";
        break;
      case 'meeting':
        typeIcon = <Users size={16} className="mr-2" />;
        typeText = "Reunión";
        break;
      case 'license':
        typeIcon = <Plane size={16} className="mr-2" />;
        typeText = "Licencia";
        break;
      default:
        typeIcon = <CalendarDays size={16} className="mr-2" />;
        typeText = "Otro";
    }
    
    // Determinar si el usuario actual puede editar el evento
    const canEdit = currentUser && (
      currentUser.id === selectedEvent.createdBy || 
      currentUser.role === 'Administrador' ||
      (selectedEvent.type === 'license' && currentUser.role === 'Gestor') ||
      (selectedEvent.type === 'license' && currentUser.especialidad === 'Administracion')
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">{selectedEvent.title}</h3>
            <button
              onClick={() => setShowEventDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div 
                className="w-4 h-4 rounded-full mt-1 mr-2"
                style={{ backgroundColor: selectedEvent.color || '#4f46e5' }}
              ></div>
              <div>
                <p className="text-sm text-gray-500">
                  {typeText}
                </p>
                <h4 className="text-lg font-medium">{selectedEvent.title}</h4>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600">
              <CalendarDays size={18} className="mr-2" />
              <div>
                <p>
                  {new Date(selectedEvent.startDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p>
                  {new Date(selectedEvent.startDate).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(selectedEvent.endDate).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            {project && (
              <div className="flex items-center text-gray-600">
                <Briefcase size={18} className="mr-2" />
                <p>Proyecto: {project.name}</p>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <User size={18} className="mr-2" />
              <p>Creado por: {creator ? `${creator.firstName} ${creator.lastName}` : 'Usuario desconocido'}</p>
            </div>
            
            {selectedEvent.attendees.length > 0 && (
              <div className="flex items-start text-gray-600">
                <Users size={18} className="mr-2 mt-1" />
                <div>
                  <p className="font-medium">Asistentes:</p>
                  <ul className="list-disc list-inside pl-2">
                    {attendeesList.map(attendee => (
                      <li key={attendee.id} className="text-sm">
                        {attendee ? `${attendee.firstName} ${attendee.lastName}` : 'Usuario desconocido'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {selectedEvent.description && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <FileText size={18} className="mr-2" />
                  Descripción
                </h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedEvent.description}</p>
              </div>
            )}
            
            {selectedEvent.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Archivos adjuntos</h4>
                <div className="space-y-2">
                  {selectedEvent.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        <FileText size={18} className="mr-2 text-blue-600" />
                        <span>{attachment.originalName}</span>
                      </div>
                      <div>
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6 space-x-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-1 inline" />
                    Eliminar
                  </button>
                  <button
                    onClick={handleEditEvent}
                    className="px-4 py-2 bg-[#2d2c55] text-white rounded-md hover:bg-opacity-90"
                  >
                    Editar
                  </button>
                </>
              )}
              <button
                onClick={() => setShowEventDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar modal de confirmación de eliminación
  const renderDeleteConfirmation = () => {
    if (!showDeleteConfirm) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium mb-4">Confirmar eliminación</h3>
          <p className="mb-4">¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Calendario</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" />
              Volver al dashboard
            </button>
          </div>
          
          {renderCalendar()}
          {renderEventModal()}
          {renderEventDetails()}
          {renderDeleteConfirmation()}
        </div>
      </div>
    </ProtectedRoute>
  );
} 