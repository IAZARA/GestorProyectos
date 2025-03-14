'use client';
import React, { useState } from 'react';
import { Task, TaskStatus } from '../../../types/project';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Plus, X, Edit, User } from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { getProjectById, addTask, updateTask, deleteTask } = useProjectStore();
  const { getUserById } = useUserStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [currentColumn, setCurrentColumn] = useState<TaskStatus>('Por Hacer');
  
  const project = getProjectById(projectId);
  const { currentUser } = useUserStore();
  
  if (!project || !currentUser) return null;
  
  const users = project.members.map(memberId => getUserById(memberId)).filter(Boolean);
  
  const columns: { title: string; status: TaskStatus; bgColor: string }[] = [
    { title: 'Por Hacer', status: 'Por Hacer', bgColor: 'bg-red-50' },
    { title: 'En Progreso', status: 'En Progreso', bgColor: 'bg-yellow-50' },
    { title: 'Completado', status: 'Completado', bgColor: 'bg-green-50' }
  ];
  
  const getTasksByStatus = (status: TaskStatus) => {
    return project.tasks.filter(task => task.status === status);
  };
  
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    addTask(projectId, {
      title: newTaskTitle,
      description: newTaskDescription,
      status: currentColumn,
      createdBy: currentUser.id,
      assignedTo: newTaskAssignee || undefined
    });
    
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignee('');
    setIsAddingTask(false);
  };
  
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    updateTask(projectId, taskId, { status: newStatus });
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description);
    setNewTaskAssignee(task.assignedTo || '');
    setCurrentColumn(task.status);
  };
  
  const handleSaveEdit = () => {
    if (!editingTaskId || !newTaskTitle.trim()) return;
    
    updateTask(projectId, editingTaskId, {
      title: newTaskTitle,
      description: newTaskDescription,
      assignedTo: newTaskAssignee || undefined
    });
    
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignee('');
  };
  
  const handleDeleteTask = (taskId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteTask(projectId, taskId);
    }
  };
  
  const calculateProgress = () => {
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'Completado').length;
    return Math.round((completedTasks / totalTasks) * 100);
  };
  
  const getTaskCardColor = (status: TaskStatus) => {
    switch (status) {
      case 'Por Hacer':
        return 'bg-red-100 border-red-200';
      case 'En Progreso':
        return 'bg-yellow-100 border-yellow-200';
      case 'Completado':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-white border-gray-200';
    }
  };
  
  const progress = calculateProgress();
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h3 className="text-lg font-medium">Progreso del proyecto</h3>
          <span className="ml-2 text-sm font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {columns.map(column => (
          <div 
            key={column.status} 
            className={`rounded-lg p-4 flex flex-col ${column.bgColor}`}
          >
            <h3 className="font-medium text-lg mb-4">{column.title}</h3>
            
            <div className="space-y-3 flex-1">
              {getTasksByStatus(column.status).map(task => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded shadow-sm border ${getTaskCardColor(task.status)}`}
                >
                  {editingTaskId === task.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        className="w-full p-2 border rounded bg-white"
                        placeholder="Título de la tarea"
                      />
                      <textarea
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        className="w-full p-2 border rounded bg-white"
                        placeholder="Descripción"
                        rows={3}
                      />
                      <select
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        className="w-full p-2 border rounded bg-white"
                      >
                        <option value="">Sin asignar</option>
                        {users.map(user => user && (
                          <option key={user?.id || 'unknown'} value={user?.id || ''}>
                            {user?.firstName || ''} {user?.lastName || ''}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="px-3 py-1 bg-gray-200 rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 mb-2">
                        {task.description}
                      </p>
                      
                      {task.assignedTo && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <User size={14} className="mr-1" />
                          <span>
                            {getUserById(task.assignedTo)?.firstName} {getUserById(task.assignedTo)?.lastName}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {columns.map(col => (
                          <button
                            key={col.status}
                            onClick={() => handleUpdateTaskStatus(task.id, col.status)}
                            className={`text-xs px-2 py-1 rounded ${
                              task.status === col.status
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {col.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {isAddingTask && currentColumn === column.status ? (
              <div className="mt-3 bg-white p-3 rounded shadow-sm border border-gray-200">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Título de la tarea"
                />
                <textarea
                  value={newTaskDescription}
                  onChange={e => setNewTaskDescription(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Descripción"
                  rows={3}
                />
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="">Sin asignar</option>
                  {users.map(user => user && (
                    <option key={user?.id || 'unknown'} value={user?.id || ''}>
                      {user?.firstName || ''} {user?.lastName || ''}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddingTask(false)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAddingTask(true);
                  setCurrentColumn(column.status);
                }}
                className="mt-3 flex items-center justify-center w-full py-2 bg-white hover:bg-gray-50 rounded-md transition border border-gray-200"
              >
                <Plus size={16} className="mr-1" />
                <span>Añadir tarea</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 