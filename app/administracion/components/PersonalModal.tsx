'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUserStore } from '../../../store/userStore';
import { useAdminStore } from '../../../store/adminStore';
import { PersonalInfo } from '../../../types/admin';

interface PersonalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
}

export default function PersonalModal({ isOpen, onClose, editingItem }: PersonalModalProps) {
  const { users } = useUserStore();
  const { addPersonalInfo, updatePersonalInfo } = useAdminStore();
  
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({
    userId: '',
    fechaNacimiento: '',
    dni: '',
    domicilio: '',
    celular: '',
    telefonoAlternativo: '',
    email: '',
    dependencia: '',
    telefonoDependencia: '',
    direccionDependencia: '',
    registroAutomotor: false,
    grupoSanguineo: ''
  });
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        fechaNacimiento: editingItem.fechaNacimiento ? new Date(editingItem.fechaNacimiento).toISOString().split('T')[0] : ''
      });
      setSelectedUserId(editingItem.userId);
    } else {
      setFormData({
        userId: '',
        fechaNacimiento: '',
        dni: '',
        domicilio: '',
        celular: '',
        telefonoAlternativo: '',
        email: '',
        dependencia: '',
        telefonoDependencia: '',
        direccionDependencia: '',
        registroAutomotor: false,
        grupoSanguineo: ''
      });
      setSelectedUserId('');
    }
  }, [editingItem]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (name === 'userId') {
      setSelectedUserId(value);
      const user = users.find(u => u.id === value);
      if (user) {
        setFormData(prev => ({ 
          ...prev, 
          userId: value,
          email: user.email
        }));
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Por favor, seleccione un usuario');
      return;
    }
    
    const personalData = {
      ...formData,
      userId: selectedUserId
    } as PersonalInfo;
    
    if (editingItem) {
      updatePersonalInfo(selectedUserId, personalData);
    } else {
      addPersonalInfo(personalData);
    }
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {editingItem ? 'Editar información de personal' : 'Agregar información de personal'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario *
              </label>
              <select
                name="userId"
                value={selectedUserId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                disabled={!!editingItem}
              >
                <option value="">Seleccione un usuario</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  D.N.I. / CUIT
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio
              </label>
              <input
                type="text"
                name="domicilio"
                value={formData.domicilio || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Alternativo
                </label>
                <input
                  type="text"
                  name="telefonoAlternativo"
                  value={formData.telefonoAlternativo || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                readOnly={!!selectedUserId}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dependencia
              </label>
              <input
                type="text"
                name="dependencia"
                value={formData.dependencia || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Dependencia
                </label>
                <input
                  type="text"
                  name="telefonoDependencia"
                  value={formData.telefonoDependencia || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Dependencia
                </label>
                <input
                  type="text"
                  name="direccionDependencia"
                  value={formData.direccionDependencia || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo Sanguíneo
                </label>
                <input
                  type="text"
                  name="grupoSanguineo"
                  value={formData.grupoSanguineo || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="A+, O-, etc."
                />
              </div>
              
              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  name="registroAutomotor"
                  checked={formData.registroAutomotor || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Posee Registro de Conducir
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingItem ? 'Guardar cambios' : 'Agregar información'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 