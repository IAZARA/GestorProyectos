'use client';
import React, { useState, useEffect } from 'react';
import { useProjectStore, syncProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Plus, X, Edit2, Circle, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo?: string;
  priority?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { getProjectById, updateTask, addTask, deleteTask } = useProjectStore();
  const { users, getUserById } = useUserStore();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pendiente',
    assignedTo: '',
    priority: 'Media'
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});

  // Cargar el proyecto y sus tareas
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          setTasks(projectData.tasks || []);

          // Cargar nombres de los asignados a las tareas
          const assigneeMap: Record<string, string> = {};
          for (const task of projectData.tasks || []) {
            if (task.assignedTo && !assigneeMap[task.assignedTo]) {
              try {
                const user = await getUserById(task.assignedTo);
                if (user) {
                  assigneeMap[task.assignedTo] = `${user.firstName} ${user.lastName}`;
                }
              } catch (error) {
                console.error(`Error al cargar el usuario asignado ${task.assignedTo}:`, error);
              }
            }
          }
          setAssigneeNames(assigneeMap);
        }
      } catch (error) {
        console.error('Error al cargar el proyecto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProjectById, getUserById]);

  // Sincronizar el store para forzar la persistencia
  const syncStore = () => {
    // Usar función global de sincronización
    syncProjectStore();
    console.log("Tablero Kanban: Store sincronizado");
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title.trim()) return;

      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser) {
        console.error("No hay usuario actual para crear la tarea");
        return;
      }

      console.log("Creando nueva tarea:", newTask);

      const task = {
        ...newTask,
        createdBy: currentUser.id
      };

      // Crear la tarea en el store
      const createdTask = await addTask(projectId, task);
      
      if (createdTask) {
        console.log("Tarea creada exitosamente:", createdTask);
        
        // Forzar la sincronización del store para persistir
        syncStore();
      } else {
        console.warn("La tarea se creó pero no se recibió respuesta");
      }
      
      setShowNewTaskForm(false);
      setNewTask({
        title: '',
        description: '',
        status: 'Pendiente',
        assignedTo: '',
        priority: 'Media'
      });

      // Actualizar el estado local
      setTimeout(() => {
        const updatedProject = getProjectById(projectId);
        if (updatedProject) {
          console.log("Proyecto actualizado después de crear tarea:", updatedProject);
          setProject(updatedProject);
          setTasks(Array.isArray(updatedProject.tasks) ? updatedProject.tasks : []);
        } else {
          console.error("No se pudo obtener el proyecto actualizado");
        }
      }, 100); // Pequeño retraso para asegurar que el store esté actualizado
    } catch (error) {
      console.error("Error al crear la tarea:", error);
      alert("Hubo un error al crear la tarea. Por favor, inténtelo de nuevo.");
    }
  };

  const handleUpdateTask = async (taskId: string, status: string) => {
    try {
      console.log(`Actualizando tarea ${taskId} a estado: ${status}`);
      
      // Actualizar la tarea en el store
      const updatedTask = await updateTask(projectId, taskId, { status });
      
      if (updatedTask) {
        console.log("Tarea actualizada exitosamente:", updatedTask);
        
        // Forzar la sincronización del store para persistir
        syncStore();
      }
      
      // Actualizar el estado local con un pequeño retraso
      setTimeout(() => {
        const updatedProject = getProjectById(projectId);
        if (updatedProject) {
          console.log("Proyecto actualizado después de actualizar tarea");
          setProject(updatedProject);
          setTasks(Array.isArray(updatedProject.tasks) ? updatedProject.tasks : []);
        } else {
          console.error("No se pudo obtener el proyecto actualizado");
        }
      }, 100);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta tarea?')) {
      try {
        console.log(`Eliminando tarea ${taskId}`);
        
        // Eliminar la tarea en el store
        const success = await deleteTask(projectId, taskId);
        
        if (success) {
          console.log("Tarea eliminada exitosamente");
          
          // Forzar la sincronización del store para persistir
          syncStore();
        }
        
        // Actualizar el estado local con un pequeño retraso
        setTimeout(() => {
          const updatedProject = getProjectById(projectId);
          if (updatedProject) {
            console.log("Proyecto actualizado después de eliminar tarea");
            setProject(updatedProject);
            setTasks(Array.isArray(updatedProject.tasks) ? updatedProject.tasks : []);
          } else {
            console.error("No se pudo obtener el proyecto actualizado");
          }
        }, 100);
      } catch (error) {
        console.error("Error al eliminar la tarea:", error);
      }
    }
  };

  const handleSaveEditTask = async () => {
    if (!editingTask) return;

    try {
      console.log(`Guardando cambios en tarea ${editingTask.id}:`, editingTask);
      
      // Actualizar la tarea en el store
      const updatedTask = await updateTask(projectId, editingTask.id, editingTask);
      setEditingTask(null);
      
      if (updatedTask) {
        console.log("Tarea editada exitosamente:", updatedTask);
        
        // Forzar la sincronización del store para persistir
        syncStore();
      }
      
      // Actualizar el estado local con un pequeño retraso
      setTimeout(() => {
        const updatedProject = getProjectById(projectId);
        if (updatedProject) {
          console.log("Proyecto actualizado después de editar tarea");
          setProject(updatedProject);
          setTasks(Array.isArray(updatedProject.tasks) ? updatedProject.tasks : []);
          
          // Actualizar nombres de asignados si es necesario
          if (editingTask.assignedTo && !assigneeNames[editingTask.assignedTo]) {
            getUserById(editingTask.assignedTo).then(user => {
              if (user) {
                setAssigneeNames(prev => ({
                  ...prev,
                  [editingTask.assignedTo as string]: `${user.firstName} ${user.lastName}`
                }));
              }
            });
          }
        } else {
          console.error("No se pudo obtener el proyecto actualizado");
        }
      }, 100);
    } catch (error) {
      console.error("Error al guardar la tarea:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Asegurar que tasks sea un array
  const taskArray = Array.isArray(tasks) ? tasks : [];
  
  // Agrupar tareas por estado (considerando diferentes posibles formatos de estado)
  const pendingTasks = taskArray.filter(task => 
    task.status === 'Pendiente' || task.status === 'pendiente' || task.status === 'Por Hacer'
  );
  
  const inProgressTasks = taskArray.filter(task => 
    task.status === 'En_Progreso' || task.status === 'en_progreso' || task.status === 'En Progreso'
  );
  
  const completedTasks = taskArray.filter(task => 
    task.status === 'Completado' || task.status === 'completado'
  );
  
  // Calcular y mostrar el progreso (sin un useEffect adicional)
  if (project && taskArray.length > 0) {
    try {
      const percentage = (completedTasks.length / taskArray.length) * 100;
      console.log(`Progreso calculado: ${completedTasks.length}/${taskArray.length} = ${percentage.toFixed(1)}%`);
    } catch (error) {
      console.error("Error al calcular progreso:", error);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'text-red-600';
      case 'Media':
        return 'text-yellow-600';
      case 'Baja':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAssigneeName = (userId?: string) => {
    if (!userId) return 'Sin asignar';
    
    // Si ya tenemos el nombre en el caché, usarlo
    if (assigneeNames[userId]) return assigneeNames[userId];
    
    // Buscar en la lista de usuarios
    const user = users.find(u => u.id === userId);
    if (user) {
      // Actualizar caché
      setTimeout(() => {
        setAssigneeNames(prev => ({
          ...prev,
          [userId]: `${user.firstName} ${user.lastName}`
        }));
      }, 0);
      
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Si no lo encontramos, intentar cargarlo
    setTimeout(async () => {
      try {
        const user = await getUserById(userId);
        if (user) {
          setAssigneeNames(prev => ({
            ...prev,
            [userId]: `${user.firstName} ${user.lastName}`
          }));
        }
      } catch (error) {
        console.error(`Error al cargar el usuario ${userId}:`, error);
      }
    }, 0);
    
    return 'Cargando...';
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white shadow rounded p-4 mb-3 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <h4 className="font-medium">{task.title}</h4>
        <div className="flex space-x-2">
          <button 
            onClick={() => setEditingTask(task)}
            className="text-gray-500 hover:text-blue-500"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteTask(task.id)}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center mt-2 text-xs">
        <div className="flex items-center">
          <span className={`flex items-center ${getPriorityColor(task.priority || 'Media')}`}>
            <Circle size={8} className="mr-1" fill="currentColor" /> 
            Prioridad: {task.priority || 'Media'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">
            {getAssigneeName(task.assignedTo)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Tablero Kanban</h2>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="flex items-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} className="mr-1" /> Nueva Tarea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna Pendiente */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center mb-4 text-yellow-700">
            <Clock size={18} className="mr-2" />
            <h3 className="font-medium">Por Hacer ({pendingTasks.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div 
                key={task.id} 
                draggable
                onDragEnd={() => handleUpdateTask(task.id, 'En_Progreso')}
              >
                <TaskCard task={task} />
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="p-3 bg-gray-100 rounded text-center text-gray-500 text-sm">
                No hay tareas pendientes
              </div>
            )}
          </div>
        </div>

        {/* Columna En Progreso */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center mb-4 text-blue-700">
            <AlertCircle size={18} className="mr-2" />
            <h3 className="font-medium">En Progreso ({inProgressTasks.length})</h3>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <div 
                key={task.id} 
                draggable
                onDragEnd={() => handleUpdateTask(task.id, 'Completado')}
              >
                <TaskCard task={task} />
              </div>
            ))}
            {inProgressTasks.length === 0 && (
              <div className="p-3 bg-gray-100 rounded text-center text-gray-500 text-sm">
                No hay tareas en progreso
              </div>
            )}
          </div>
        </div>

        {/* Columna Completado */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center mb-4 text-green-700">
            <CheckCircle size={18} className="mr-2" />
            <h3 className="font-medium">Completado ({completedTasks.length})</h3>
          </div>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id}>
                <TaskCard task={task} />
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="p-3 bg-gray-100 rounded text-center text-gray-500 text-sm">
                No hay tareas completadas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para nueva tarea */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Nueva Tarea</h3>
              <button 
                onClick={() => setShowNewTaskForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Título de la tarea"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Descripción detallada"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="Pendiente">Por Hacer</option>
                  <option value="En_Progreso">En Progreso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sin asignar</option>
                  {project && project.members && project.members.map((memberId: string) => {
                    const member = users.find(u => u.id === memberId);
                    return member ? (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!newTask.title.trim()}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar tarea */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Editar Tarea</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={3}
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="Pendiente">Por Hacer</option>
                  <option value="En_Progreso">En Progreso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                <select
                  value={editingTask.assignedTo || ''}
                  onChange={(e) => setEditingTask({...editingTask, assignedTo: e.target.value || undefined})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sin asignar</option>
                  {project && project.members && project.members.map((memberId: string) => {
                    const member = users.find(u => u.id === memberId);
                    return member ? (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={editingTask.priority || 'Media'}
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 