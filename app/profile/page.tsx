'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserStore } from '../../store/userStore';
import { User, Expertise, Role } from '../../types/user';
import { Save, ArrowLeft, Camera, X, Upload, Mail, Briefcase, Shield } from 'lucide-react';
import Image from 'next/image';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { currentUser, updateUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    expertise: '' as Expertise,
    photoUrl: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        expertise: currentUser.expertise,
        photoUrl: currentUser.photoUrl || '',
        password: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [status, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Cargando...</p>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo debe ser una imagen');
      return;
    }
    
    setIsUploading(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir la imagen');
      }
      
      const data = await response.json();
      
      // Actualizar la URL de la foto en el estado
      setFormData(prev => ({
        ...prev,
        photoUrl: data.url
      }));
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setErrorMessage('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);
    
    try {
      // Validar que las contraseñas coincidan si se está cambiando
      if (formData.password && formData.password !== formData.confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden');
        setIsSaving(false);
        return;
      }
      
      // Preparar datos para actualizar
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        expertise: formData.expertise,
        photoUrl: formData.photoUrl,
        ...(formData.password ? { password: formData.password } : {})
      };
      
      // Actualizar usuario
      const updatedUser = await updateUser(currentUser.id, updateData);
      
      if (updatedUser) {
        // Actualizar la sesión de NextAuth
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: `${formData.firstName} ${formData.lastName}`,
            image: formData.photoUrl
          }
        });
        
        setSuccessMessage('Perfil actualizado correctamente');
        
        // Limpiar campos de contraseña
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        setErrorMessage('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setErrorMessage('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const ProfileContent = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Volver al dashboard</span>
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">Mi perfil</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {/* Foto de perfil */}
            <div className="mb-8 flex flex-col items-center">
              <div className="relative mb-4">
                {formData.photoUrl ? (
                  <div className="relative">
                    <img 
                      src={formData.photoUrl} 
                      alt="Foto de perfil" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-medium border-4 border-white shadow">
                    {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                Haz clic en el icono de cámara para subir una foto
              </p>
            </div>
            
            {/* Información personal */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4 border-b pb-2">Información personal</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede cambiar
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <select
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="Administrativo">Administrativo</option>
                  <option value="Tecnico">Técnico</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>
            
            {/* Cambio de contraseña */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4 border-b pb-2">Cambiar contraseña</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  autoComplete="new-password"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nueva contraseña"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  autoComplete="new-password"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
            </div>
            
            {/* Mensajes de éxito o error */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            
            {/* Botones */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 mr-2"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
} 