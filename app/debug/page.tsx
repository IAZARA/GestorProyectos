'use client';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import bcrypt from 'bcryptjs';
import AuthStatus from '../components/AuthStatus';

export default function DebugPage() {
  const { users, addUser, resetUserPassword, login } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [storeContent, setStoreContent] = useState('');
  const [localStorageContent, setLocalStorageContent] = useState('');
  const [testLoginResult, setTestLoginResult] = useState('');
  const [usersInLocalStorage, setUsersInLocalStorage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener el contenido del localStorage
    try {
      const userStorage = localStorage.getItem('user-storage');
      if (userStorage) {
        const parsedStorage = JSON.parse(userStorage);
        if (parsedStorage.state && parsedStorage.state.users) {
          setUsersInLocalStorage(parsedStorage.state.users);
        }
      }
    } catch (error) {
      console.error('Error al cargar usuarios del localStorage:', error);
    } finally {
      setLoading(false);
    }

    // Obtener el contenido del store
    setStoreContent(JSON.stringify(users, null, 2));
  }, [users]);

  const handleResetPassword = async () => {
    if (!email || !password) {
      setMessage('Por favor, ingresa email y contraseña');
      return;
    }

    try {
      const success = await resetUserPassword(email, password);
      if (success) {
        setMessage(`Contraseña actualizada exitosamente para ${email}`);
        // Actualizar el contenido del store
        setStoreContent(JSON.stringify(useUserStore.getState().users, null, 2));
      } else {
        setMessage(`No se encontró el usuario con email ${email}`);
      }
    } catch (error) {
      setMessage('Error al resetear contraseña: ' + error);
    }
  };

  const handleCreateTestUser = async () => {
    if (!email || !password) {
      setMessage('Por favor, ingresa email y contraseña');
      return;
    }

    try {
      const newUser = await addUser({
        firstName: 'Test',
        lastName: 'User',
        email,
        password,
        role: 'Usuario',
        expertise: 'Tecnico',
        photoUrl: ''
      });
      
      setMessage(`Usuario de prueba creado exitosamente: ${newUser.email}`);
      // Actualizar el contenido del store
      setStoreContent(JSON.stringify(useUserStore.getState().users, null, 2));
    } catch (error) {
      setMessage('Error al crear usuario de prueba: ' + error);
    }
  };

  const handleTestLogin = async () => {
    if (!email || !password) {
      setTestLoginResult('Por favor, ingresa email y contraseña');
      return;
    }

    try {
      const user = await login(email, password);
      if (user) {
        setTestLoginResult(`Login exitoso para: ${user.email}`);
      } else {
        setTestLoginResult(`Login fallido para: ${email}`);
      }
    } catch (error) {
      setTestLoginResult('Error al probar login: ' + error);
    }
  };

  const handleClearLocalStorage = () => {
    try {
      localStorage.removeItem('user-storage');
      setMessage('LocalStorage limpiado exitosamente');
      window.location.reload();
    } catch (error) {
      setMessage('Error al limpiar localStorage: ' + error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Depuración</h1>
      
      <div className="mb-8">
        <AuthStatus />
      </div>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Gestión de Usuarios</h2>
        <div className="mb-4">
          <label className="block mb-1">Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Contraseña:</label>
          <input 
            type="text" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={handleResetPassword}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Resetear Contraseña
          </button>
          <button 
            onClick={handleCreateTestUser}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Crear Usuario de Prueba
          </button>
          <button 
            onClick={handleTestLogin}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Probar Login
          </button>
          <button 
            onClick={handleClearLocalStorage}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpiar LocalStorage
          </button>
        </div>
        {message && (
          <div className="mt-4 p-2 bg-yellow-100 border border-yellow-200 rounded">
            {message}
          </div>
        )}
        {testLoginResult && (
          <div className="mt-4 p-2 bg-blue-100 border border-blue-200 rounded">
            {testLoginResult}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Contenido del Store</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {storeContent}
          </pre>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Contenido del localStorage</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {localStorageContent}
          </pre>
        </div>
      </div>

      <div className="mt-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Usuarios en localStorage ({usersInLocalStorage.length})</h2>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Apellido</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Rol</th>
                <th className="py-2 px-4 border-b">Especialidad</th>
              </tr>
            </thead>
            <tbody>
              {usersInLocalStorage.map((user) => (
                <tr key={user.id}>
                  <td className="py-2 px-4 border-b">{user.id}</td>
                  <td className="py-2 px-4 border-b">{user.firstName}</td>
                  <td className="py-2 px-4 border-b">{user.lastName}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.role}</td>
                  <td className="py-2 px-4 border-b">{user.expertise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 