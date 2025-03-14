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
  Plane,
  Edit
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
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'year'>('month');
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
  const [creatorData, setCreatorData] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [attendeesData, setAttendeesData] = useState<any[]>([]);
  
  // Cargar detalles del evento
  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        if (selectedEvent && showEventDetails) {
          if (selectedEvent.createdBy) {
            const creator = await getUserById(selectedEvent.createdBy);
            if (creator) setCreatorData(creator);
          }
          
          if (selectedEvent.projectId) {
            const project = await getProjectById(selectedEvent.projectId);
            if (project) setProjectData(project);
          }
          
          if (selectedEvent.attendees && selectedEvent.attendees.length > 0) {
            const attendeesPromises = selectedEvent.attendees.map(id => getUserById(id));
            const attendeesResults = await Promise.all(attendeesPromises);
            setAttendeesData(attendeesResults.filter(Boolean));
          }
        }
      } catch (error) {
        console.error('Error al cargar detalles del evento:', error);
      }
    };
    
    loadEventDetails();
  }, [selectedEvent, showEventDetails, getUserById, getProjectById]);
  
  // Funciones de navegación del calendario
  const handlePrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (currentView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    }
  };
  
  const handleNext = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (currentView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    }
  };
  
  const handleToday = () => {
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
  
  // Función para descargar archivos adjuntos
  const handleDownloadAttachment = (attachmentId: string, originalName: string) => {
    try {
      // Construir la URL con el puerto correcto (3005 para la API)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      const downloadUrl = `${API_BASE_URL}/api/attachments/${attachmentId}/download`;
      
      console.log(`Intentando descargar archivo: ${originalName} (ID: ${attachmentId})`);
      console.log(`URL de descarga: ${downloadUrl}`);
      
      // Usar fetch para verificar si el archivo existe antes de abrir una nueva pestaña
      fetch(downloadUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // Si el archivo existe, abrir en una nueva pestaña
            window.open(downloadUrl, '_blank');
          } else {
            // Si hay un error, mostrar un mensaje
            console.error(`Error al verificar el archivo: ${response.status} ${response.statusText}`);
            alert(`No se pudo descargar el archivo "${originalName}". Por favor, inténtelo de nuevo más tarde.`);
          }
        })
        .catch(error => {
          console.error('Error al verificar el archivo:', error);
          alert(`Error al descargar el archivo. Por favor, inténtelo de nuevo más tarde.`);
        });
    } catch (error) {
      console.error('Error al iniciar la descarga:', error);
      alert('Ocurrió un error al intentar descargar el archivo.');
    }
  };
  
  // Renderizar el calendario
  const renderCalendar = () => {
    if (currentView === 'month') {
      return renderMonthView();
    } else if (currentView === 'week') {
      return renderWeekView();
    } else {
      return renderYearView();
    }
  };

  // Controles de navegación del calendario
  const renderCalendarControls = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePrevious()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-semibold">
            {currentView === 'month' && (
              `${currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`
            )}
            {currentView === 'week' && (
              `Semana del ${new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())).toLocaleDateString('es-ES')} al ${new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 6)).toLocaleDateString('es-ES')}`
            )}
            {currentView === 'year' && (
              `${currentDate.getFullYear()}`
            )}
          </h2>
          
          <button
            onClick={() => handleNext()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 px-3 py-1 text-sm bg-[#2d2c55] text-white rounded hover:bg-opacity-90"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1 text-sm rounded ${
              currentView === 'month' ? 'bg-white shadow' : 'hover:bg-gray-200'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1 text-sm rounded ${
              currentView === 'week' ? 'bg-white shadow' : 'hover:bg-gray-200'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setCurrentView('year')}
            className={`px-3 py-1 text-sm rounded ${
              currentView === 'year' ? 'bg-white shadow' : 'hover:bg-gray-200'
            }`}
          >
            Año
          </button>
        </div>
      </div>
    );
  };

  // Renderizar vista mensual
  const renderMonthView = () => {
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
    
    const rows: JSX.Element[] = [];
    let days: JSX.Element[] = [];
    let day = new Date(startDate);
    
    // Encabezados de los días de la semana
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const daysOfWeekMobile = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    
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
    
    // Renderizar días
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(day);
        const dayEvents = monthEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return (
            eventDate.getDate() === currentDay.getDate() &&
            eventDate.getMonth() === currentDay.getMonth() &&
            eventDate.getFullYear() === currentDay.getFullYear()
          );
        });

        const isCurrentMonth = currentDay.getMonth() === currentDate.getMonth();
        const isToday = (
          currentDay.getDate() === new Date().getDate() &&
          currentDay.getMonth() === new Date().getMonth() &&
          currentDay.getFullYear() === new Date().getFullYear()
        );

        days.push(
          <div
            key={currentDay.toISOString()}
            className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-200 ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
            } ${isToday ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50`}
            onClick={() => handleDateClick(currentDay)}
          >
            <div className="font-semibold text-xs sm:text-sm">{currentDay.getDate()}</div>
            <div className="space-y-1 overflow-hidden max-h-[60px] sm:max-h-[80px]">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded truncate`}
                  style={{ backgroundColor: event.color || '#4f46e5', color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{dayEvents.length - 3} más
                </div>
              )}
            </div>
          </div>
        );

        day.setDate(day.getDate() + 1);
      }

      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-1 border-b">
          {daysOfWeek.map((dayName, index) => (
            <div key={dayName} className="text-center font-medium py-2 hidden sm:block">
              {dayName}
            </div>
          ))}
          {daysOfWeekMobile.map((dayName, index) => (
            <div key={dayName} className="text-center font-medium py-2 block sm:hidden">
              {dayName}
            </div>
          ))}
        </div>
        <div className="space-y-1 p-1">
          {rows}
        </div>
      </div>
    );
  };

  // Renderizar vista semanal
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const daysOfWeekShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am a 8pm
    
    // Filtrar eventos para la semana actual
    const weekEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (
        (eventStart >= weekStart && eventStart <= weekEnd) ||
        (eventEnd >= weekStart && eventEnd <= weekEnd) ||
        (eventStart <= weekStart && eventEnd >= weekEnd)
      );
    });
    
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[600px] md:min-w-[800px]">
          {/* Encabezados de días */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r"></div>
            {Array.from({ length: 7 }, (_, i) => {
              const day = new Date(weekStart);
              day.setDate(weekStart.getDate() + i);
              const isToday = (
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear()
              );
              
              return (
                <div 
                  key={i} 
                  className={`p-2 text-center ${isToday ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    handleDateClick(day);
                  }}
                >
                  <div className="font-medium hidden md:block">{daysOfWeek[i]}</div>
                  <div className="font-medium md:hidden">{daysOfWeekShort[i]}</div>
                  <div className="text-sm">{day.getDate()}/{day.getMonth() + 1}</div>
                </div>
              );
            })}
          </div>
          
          {/* Horas y eventos */}
          <div>
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b">
                <div className="p-2 border-r text-sm text-right">
                  {hour}:00
                </div>
                
                {Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(weekStart);
                  day.setDate(weekStart.getDate() + i);
                  day.setHours(hour, 0, 0, 0);
                  
                  const hourEvents = weekEvents.filter(event => {
                    const eventStart = new Date(event.startDate);
                    return (
                      eventStart.getDate() === day.getDate() &&
                      eventStart.getMonth() === day.getMonth() &&
                      eventStart.getFullYear() === day.getFullYear() &&
                      eventStart.getHours() === hour
                    );
                  });
                  
                  return (
                    <div 
                      key={i} 
                      className="p-1 min-h-[60px] border-r"
                      onClick={() => {
                        setSelectedDate(day);
                        setShowEventModal(true);
                      }}
                    >
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 mb-1 rounded truncate"
                          style={{ backgroundColor: event.color || '#4f46e5', color: 'white' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar vista anual
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const shortMonths = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {months.map((month, index) => {
            const monthDate = new Date(year, index, 1);
            const daysInMonth = new Date(year, index + 1, 0).getDate();
            
            // Contar eventos por mes
            const monthEvents = events.filter(event => {
              const eventDate = new Date(event.startDate);
              return eventDate.getMonth() === index && eventDate.getFullYear() === year;
            });
            
            return (
              <div 
                key={month} 
                className="border rounded p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setCurrentDate(monthDate);
                  setCurrentView('month');
                }}
              >
                <div className="font-medium text-center mb-2 hidden sm:block">{month}</div>
                <div className="font-medium text-center mb-2 block sm:hidden">{shortMonths[index]}</div>
                <div className="text-sm grid grid-cols-7 gap-1">
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-500">{day}</div>
                  ))}
                  
                  {/* Espacios en blanco para el primer día del mes */}
                  {Array.from({ length: new Date(year, index, 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`}></div>
                  ))}
                  
                  {/* Días del mes */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dayDate = new Date(year, index, day);
                    const isToday = (
                      day === new Date().getDate() &&
                      index === new Date().getMonth() &&
                      year === new Date().getFullYear()
                    );
                    
                    // Verificar si hay eventos en este día
                    const hasEvents = events.some(event => {
                      const eventDate = new Date(event.startDate);
                      return (
                        eventDate.getDate() === day &&
                        eventDate.getMonth() === index &&
                        eventDate.getFullYear() === year
                      );
                    });
                    
                    return (
                      <div 
                        key={day}
                        className={`text-center text-xs p-1 ${isToday ? 'bg-blue-100 rounded' : ''} ${hasEvents ? 'font-bold text-blue-600' : ''}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-center text-gray-600">
                  {monthEvents.length} eventos
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Renderizar modal de evento
  const renderEventModal = () => {
    if (!showEventModal) return null;
    
    const [newAttendee, setNewAttendee] = useState('');
    const handleAddAttendee = () => {
      setEventFormData(prev => ({ ...prev, attendees: [...prev.attendees, newAttendee] }));
      setNewAttendee('');
    };
    const handleRemoveAttendee = (index: number) => {
      setEventFormData(prev => ({ ...prev, attendees: prev.attendees.filter((_, i) => i !== index) }));
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {isNewEvent ? 'Crear nuevo evento' : 'Editar evento'}
            </h3>
            <button
              onClick={() => setShowEventModal(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
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
                  className="w-full p-2 border rounded text-sm sm:text-base"
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
                  className="w-full p-2 border rounded text-sm sm:text-base"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora de inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventFormData.startDate.toISOString().slice(0, 16)}
                    onChange={(e) => handleDateChange(e, 'startDate')}
                    className="w-full p-2 border rounded text-sm sm:text-base"
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
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de evento
                  </label>
                  <select
                    name="type"
                    value={eventFormData.type}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded text-sm sm:text-base"
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
                    className="w-full p-2 border rounded text-sm sm:text-base"
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
                <div className="flex flex-wrap gap-2">
                  {['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ${eventFormData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEventFormData({...eventFormData, color})}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asistentes
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {eventFormData.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{attendee}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        aria-label="Eliminar asistente"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="email"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    placeholder="Correo electrónico"
                    className="flex-1 p-2 border rounded-l text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttendee}
                    className="bg-[#2d2c55] text-white px-3 py-2 rounded-r hover:bg-opacity-90"
                    aria-label="Agregar asistente"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2d2c55] text-white rounded text-sm hover:bg-opacity-90"
              >
                {isNewEvent ? 'Crear' : 'Guardar'}
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
    
    let eventIcon;
    switch (selectedEvent.type) {
      case 'project':
        eventIcon = <Briefcase size={16} className="mr-2" />;
        break;
      case 'meeting':
        eventIcon = <Users size={16} className="mr-2" />;
        break;
      case 'license':
        eventIcon = <Plane size={16} className="mr-2" />;
        break;
      default:
        eventIcon = <CalendarDays size={16} className="mr-2" />;
    }
    
    const canEdit = currentUser && (
      currentUser.id === selectedEvent.createdBy || 
      currentUser.role === 'Administrador' ||
      (selectedEvent.type === 'license' && currentUser.role === 'Gestor') ||
      (selectedEvent.type === 'license' && currentUser.especialidad === 'Administracion')
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-medium">{selectedEvent.title}</h3>
            <button
              onClick={() => setShowEventDetails(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
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
                  {selectedEvent.type === 'project' ? 'Proyecto' : selectedEvent.type === 'meeting' ? 'Reunión' : selectedEvent.type === 'license' ? 'Licencia' : 'Otro'}
                </p>
                <h4 className="text-base sm:text-lg font-medium">{selectedEvent.title}</h4>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 text-sm sm:text-base">
              <CalendarDays size={18} className="mr-2 flex-shrink-0" />
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
            
            {projectData && (
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <Briefcase size={18} className="mr-2 flex-shrink-0" />
                <p>Proyecto: {projectData.name}</p>
              </div>
            )}
            
            <div className="flex items-center text-gray-600 text-sm sm:text-base">
              <User size={18} className="mr-2 flex-shrink-0" />
              <p>Creado por: {creatorData ? `${creatorData.firstName} ${creatorData.lastName}` : 'Usuario desconocido'}</p>
            </div>
            
            {selectedEvent.attendees.length > 0 && (
              <div className="flex items-start text-gray-600 text-sm sm:text-base">
                <Users size={18} className="mr-2 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Asistentes:</p>
                  <ul className="list-disc list-inside pl-2">
                    {attendeesData.map(attendee => (
                      <li key={attendee?.id || 'unknown'}>
                        {`${attendee?.firstName || 'Usuario'} ${attendee?.lastName || 'desconocido'}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {selectedEvent.description && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center text-sm sm:text-base">
                  <FileText size={18} className="mr-2 flex-shrink-0" />
                  Descripción
                </h4>
                <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base">{selectedEvent.description}</p>
              </div>
            )}
            
            {selectedEvent.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Archivos adjuntos</h4>
                <div className="space-y-2">
                  {selectedEvent.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center">
                        <FileText size={18} className="mr-2 text-blue-600 flex-shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[300px]">{attachment.originalName}</span>
                      </div>
                      <div>
                        <button 
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          aria-label="Descargar archivo"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6 space-x-2 border-t pt-4">
              {canEdit && (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    <span>Eliminar</span>
                  </button>
                  <button
                    onClick={handleEditEvent}
                    className="px-3 py-2 bg-[#2d2c55] text-white rounded text-sm hover:bg-opacity-90 flex items-center"
                  >
                    <Edit size={16} className="mr-1" />
                    <span>Editar</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowEventDetails(false)}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
          <h3 className="text-lg font-medium mb-4">Confirmar eliminación</h3>
          <p className="mb-4 text-sm sm:text-base">¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-2 sm:px-4 border rounded text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-3 py-2 sm:px-4 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Calendario</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm sm:text-base"
            >
              <ChevronLeft size={16} className="mr-1" />
              Volver al dashboard
            </button>
          </div>
          
          <div className="mb-6">
            {renderCalendarControls()}
            
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => handleDateClick(new Date())}
                className="px-3 py-2 bg-[#2d2c55] text-white rounded text-sm hover:bg-opacity-90 flex items-center"
              >
                <Plus size={16} className="mr-1" /> 
                Nuevo Evento
              </button>
            </div>
            
            {renderCalendar()}
          </div>
          {renderEventModal()}
          {renderEventDetails()}
          {renderDeleteConfirmation()}
        </div>
      </div>
    </ProtectedRoute>
  );
} 