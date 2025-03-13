import { useState } from 'react';
import { useUserStore } from '../store/userStore';

export default function UserForm({ onSuccess }) {
  const { addUser } = useUserStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    expertise: 'Administrativo',
    role: 'Usuario',
    photoUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setVerificationStatus(null);
    
    try {
      // 1. Intentar crear el usuario a través del store (que debería llamar a la API)
      const newUser = await addUser(formData);
      
      setSuccess(`Usuario ${newUser.firstName} ${newUser.lastName} creado exitosamente`);
      
      // 2. Verificar si el usuario se guardó en la base de datos
      setVerificationStatus('checking');
      
      try {
        const response = await fetch(`/api/users/verify?email=${encodeURIComponent(newUser.email)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.exists) {
            setVerificationStatus('success');
          } else {
            setVerificationStatus('warning');
            console.warn('El usuario se creó en el store pero no se encontró en la base de datos');
          }
        } else {
          setVerificationStatus('error');
          console.error('Error al verificar usuario en la base de datos');
        }
      } catch (verifyError) {
        setVerificationStatus('error');
        console.error('Error al verificar usuario:', verifyError);
      }
      
      // Limpiar el formulario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        expertise: 'Administrativo',
        role: 'Usuario',
        photoUrl: ''
      });
      
      // Llamar al callback de éxito si existe
      if (onSuccess) onSuccess(newUser);
      
    } catch (err) {
      setError(`Error al crear usuario: ${err.message}`);
      setVerificationStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Crear Nuevo Usuario</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          {success}
          
          {verificationStatus === 'checking' && (
            <div className="mt-2">Verificando en la base de datos...</div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="mt-2 text-green-700">✓ Verificado en la base de datos</div>
          )}
          
          {verificationStatus === 'warning' && (
            <div className="mt-2 text-yellow-700">
              ⚠️ El usuario se creó pero no se encontró en la base de datos.
              <br />
              <small>Esto podría indicar un problema de sincronización.</small>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="mt-2 text-red-700">
              ❌ No se pudo verificar en la base de datos.
              <br />
              <small>El usuario podría no haberse guardado correctamente.</small>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Nombre</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">Apellido</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">Especialidad</label>
            <select
              name="expertise"
              value={formData.expertise}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="Administrativo">Administrativo</option>
              <option value="Tecnico">Técnico</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Rol</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="Usuario">Usuario</option>
              <option value="Gestor">Gestor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-1">URL de Foto (opcional)</label>
            <input
              type="text"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
} 