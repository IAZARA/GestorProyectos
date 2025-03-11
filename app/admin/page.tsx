'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { useProjectStore } from '../../store/projectStore';
import { User, Role, Expertise } from '../../types/user';
import { Plus, Edit, Trash2, Users, ArrowLeft, Search } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { users, currentUser, addUser, updateUser, deleteUser } = useUserStore();
  const { projects } = useProjectStore();
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Usuario' as Role,
    expertise: 'Tecnico' as Expertise,
    photoUrl: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && currentUser?.role !== 'Administrador') {
      router.push('/dashboard');
    }
    
    if (status !== 'loading') {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [status, currentUser, router]);

  if (isLoading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Cargando...</p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Administrador') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4 text-red-600">Acceso denegado</p>
          <p className="mb-4">Solo los administradores pueden acceder a esta página.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCreateUser = () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Verificar si el email ya existe
    if (users.some(user => user.email === newUser.email)) {
      alert('Ya existe un usuario con ese email');
      return;
    }

    addUser(newUser);
    setShowUserModal(false);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Usuario',
      expertise: 'Tecnico',
      photoUrl: ''
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    if (!editingUser.firstName || !editingUser.lastName || !editingUser.email) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Verificar si el email ya existe (excepto el del usuario actual)
    if (users.some(user => user.email === editingUser.email && user.id !== editingUser.id)) {
      alert('Ya existe un usuario con ese email');
      return;
    }

    updateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    // Verificar si el usuario está asignado a algún proyecto
    const userProjects = projects.filter(project => 
      project.members.includes(userId) || project.createdBy === userId
    );

    if (userProjects.length > 0) {
      alert(`No se puede eliminar este usuario porque está asignado a ${userProjects.length} proyecto(s).`);
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      deleteUser(userId);
    }
  };

  const filteredUsers = users.filter(user => 
    user.id !== currentUser.id && // No mostrar al administrador actual
    (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Volver al dashboard</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Usuarios</h1>
          
          <button
            onClick={() => setShowUserModal(true)}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Plus size={16} className="mr-2" />
            Crear usuario
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuarios..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoUrl ? (
                            <img className="h-10 w-10 rounded-full" src={user.photoUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'Gestor' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.expertise}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No se encontraron usuarios</p>
          </div>
        )}
      </div>
      
      {/* Modal para crear usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Crear nuevo usuario</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Nombre"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Apellido"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Contraseña"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Gestor">Gestor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <select
                    value={newUser.expertise}
                    onChange={(e) => setNewUser({...newUser, expertise: e.target.value as Expertise})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="Tecnico">Técnico</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de foto (opcional)
                  </label>
                  <input
                    type="text"
                    value={newUser.photoUrl}
                    onChange={(e) => setNewUser({...newUser, photoUrl: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="URL de la foto"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para editar usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Editar usuario</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Nombre"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Apellido"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña (dejar en blanco para mantener la actual)
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Nueva contraseña"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as Role})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Gestor">Gestor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <select
                    value={editingUser.expertise}
                    onChange={(e) => setEditingUser({...editingUser, expertise: e.target.value as Expertise})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="Tecnico">Técnico</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de foto (opcional)
                  </label>
                  <input
                    type="text"
                    value={editingUser.photoUrl || ''}
                    onChange={(e) => setEditingUser({...editingUser, photoUrl: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="URL de la foto"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 