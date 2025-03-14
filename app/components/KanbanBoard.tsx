'use client';
import React, { useState } from 'react';
import { Task } from '../../types/project';
import { useUserStore } from '../../store/userStore';
import { useProjectStore } from '../../store/projectStore';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Task['status'];
  onAddTask: (status: Task['status']) => void;
  onEditTask: (task: Task) => void;
}

function KanbanColumn({ title, tasks, status, onAddTask, onEditTask }: KanbanColumnProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <button 
          onClick={() => onAddTask(status)}
          className="bg-indigo-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center text-sm"
        >
          +
        </button>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEditTask(task)}
          >
            <h4 className="font-medium">{task.title}</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            {task.assignedTo && (
              <div className="mt-2 flex justify-end">
                <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
                  {task.assignedTo}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onClose: () => void;
}

function TaskForm({ projectId, task, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<Task['status']>(task?.status || 'Por Hacer');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  
  const currentUser = useUserStore(state => state.currentUser);
  const users = useUserStore(state => state.users);
  const addTask = useProjectStore(state => state.addTask);
  const updateTask = useProjectStore(state => state.updateTask);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (task) {
      // Actualizar tarea existente
      updateTask(projectId, task.id, {
        title,
        description,
        status,
        assignedTo: assignedTo || undefined,
        updatedAt: new Date()
      });
    } else {
      // Crear nueva tarea
      addTask(projectId, {
        title,
        description,
        status,
        assignedTo: assignedTo || undefined,
        createdBy: currentUser.id
      });
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {task ? 'Editar tarea' : 'Nueva tarea'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Por Hacer">Por Hacer</option>
              <option value="En Progreso">En Progreso</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Completado">Completado</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignar a
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sin asignar</option>
              {users.map(user => user && (
                <option key={user?.id || 'unknown'} value={user?.id || ''}>
                  {user?.firstName || ''} {user?.lastName || ''} ({user?.expertise || ''})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {task ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('Por Hacer');
  
  const project = useProjectStore(state => state.getProjectById(projectId));
  
  if (!project) {
    return <div>Proyecto no encontrado</div>;
  }
  
  const tasksByStatus = {
    'Por Hacer': project.tasks.filter(task => task.status === 'Por Hacer'),
    'En Progreso': project.tasks.filter(task => task.status === 'En Progreso'),
    'En Revisión': project.tasks.filter(task => task.status === 'En Revisión'),
    'Completado': project.tasks.filter(task => task.status === 'Completado')
  };
  
  const handleAddTask = (status: Task['status']) => {
    setCurrentTask(undefined);
    setNewTaskStatus(status);
    setShowTaskForm(true);
  };
  
  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setShowTaskForm(true);
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Tablero Kanban: {project.name}</h2>
      
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="Por Hacer"
          tasks={tasksByStatus['Por Hacer']}
          status="Por Hacer"
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
        />
        <KanbanColumn
          title="En Progreso"
          tasks={tasksByStatus['En Progreso']}
          status="En Progreso"
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
        />
        <KanbanColumn
          title="En Revisión"
          tasks={tasksByStatus['En Revisión']}
          status="En Revisión"
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
        />
        <KanbanColumn
          title="Completado"
          tasks={tasksByStatus['Completado']}
          status="Completado"
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
        />
      </div>
      
      {showTaskForm && (
        <TaskForm
          projectId={projectId}
          task={currentTask}
          onClose={() => setShowTaskForm(false)}
        />
      )}
    </div>
  );
} 