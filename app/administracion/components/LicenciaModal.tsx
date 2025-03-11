'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useUserStore } from '../../../store/userStore';
import { useAdminStore } from '../../../store/adminStore';
import { Licencia, FraccionLicencia } from '../../../types/admin';

interface LicenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
}

export default function LicenciaModal({ isOpen, onClose, editingItem }: LicenciaModalProps) {
  const { users } = useUserStore();
  const { addLicencia, updateLicencia } = useAdminStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Licencia>>({
    userId: '',
    area: '',
    fechaAlta: '',
    diasTotales: 0,
    fracciones: []
  });
  
  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        fechaAlta: editingItem.fechaAlta ? new Date(editingItem.fechaAlta).toISOString().split('T')[0] : '',
        fracciones: editingItem.fracciones.map((f: FraccionLicencia) => ({
          ...f,
          desde: f.desde ? new Date(f.desde).toISOString().split('T')[0] : '',
          hasta: f.hasta ? new Date(f.hasta).toISOString().split('T')[0] : ''
        }))
      });
    } else {
      setFormData({
        userId: '',
        area: '',
        fechaAlta: '',
        diasTotales: 0,
        fracciones: [
          {
            dias: 0,
            desde: '',
            hasta: '',
            resto: 0
          }
        ]
      });
    }
  }, [editingItem]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'diasTotales') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleFraccionChange = (index: number, field: keyof FraccionLicencia, value: string | number) => {
    const newFracciones = [...(formData.fracciones || [])];
    
    if (!newFracciones[index]) {
      newFracciones[index] = { dias: 0, desde: '', hasta: '', resto: 0 };
    }
    
    if (field === 'dias' || field === 'resto') {
      newFracciones[index][field] = typeof value === 'string' ? parseInt(value as string) || 0 : value;
    } else {
      newFracciones[index][field] = value as string;
    }
    
    // Calcular resto automáticamente
    if (field === 'dias' && formData.diasTotales) {
      const diasUsados = newFracciones.reduce((total, f, i) => {
        if (i <= index) {
          return total + (f.dias || 0);
        }
        return total;
      }, 0);
      
      newFracciones[index].resto = Math.max(0, formData.diasTotales - diasUsados);
      
      // Actualizar restos de fracciones posteriores
      for (let i = index + 1; i < newFracciones.length; i++) {
        const diasUsadosHastaAqui = newFracciones.reduce((total, f, j) => {
          if (j <= i) {
            return total + (f.dias || 0);
          }
          return total;
        }, 0);
        
        newFracciones[i].resto = Math.max(0, formData.diasTotales - diasUsadosHastaAqui);
      }
    }
    
    setFormData(prev => ({ ...prev, fracciones: newFracciones }));
  };
  
  const addFraccion = () => {
    const newFracciones = [...(formData.fracciones || [])];
    const lastFraccion = newFracciones[newFracciones.length - 1];
    const resto = lastFraccion ? lastFraccion.resto : (formData.diasTotales || 0);
    
    newFracciones.push({
      dias: 0,
      desde: '',
      hasta: '',
      resto
    });
    
    setFormData(prev => ({ ...prev, fracciones: newFracciones }));
  };
  
  const removeFraccion = (index: number) => {
    if ((formData.fracciones?.length || 0) <= 1) return;
    
    const newFracciones = [...(formData.fracciones || [])];
    newFracciones.splice(index, 1);
    
    // Recalcular restos
    if (formData.diasTotales) {
      for (let i = 0; i < newFracciones.length; i++) {
        const diasUsadosHastaAqui = newFracciones.reduce((total, f, j) => {
          if (j <= i) {
            return total + (f.dias || 0);
          }
          return total;
        }, 0);
        
        newFracciones[i].resto = Math.max(0, formData.diasTotales - diasUsadosHastaAqui);
      }
    }
    
    setFormData(prev => ({ ...prev, fracciones: newFracciones }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      alert('Por favor, seleccione un usuario');
      return;
    }
    
    if (!formData.fracciones || formData.fracciones.length === 0) {
      alert('Debe agregar al menos una fracción de licencia');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const licenciaData = {
        ...formData,
        id: editingItem?.id || Date.now().toString(),
      } as Licencia;
      
      if (editingItem) {
        updateLicencia(licenciaData.id, licenciaData);
      } else {
        addLicencia(licenciaData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar la licencia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {editingItem ? 'Editar licencia' : 'Agregar licencia'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario *
                </label>
                <select
                  name="userId"
                  value={formData.userId || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                  disabled={!!editingItem}
                >
                  <option value="">Seleccione un usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.lastName}, {user.firstName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Alta
                </label>
                <input
                  type="date"
                  name="fechaAlta"
                  value={formData.fechaAlta || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días Totales *
                </label>
                <input
                  type="number"
                  name="diasTotales"
                  value={formData.diasTotales || 0}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Fracciones de Licencia</h4>
                <button
                  type="button"
                  onClick={addFraccion}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  disabled={(formData.fracciones?.length || 0) >= 3}
                >
                  <Plus size={16} className="mr-1" />
                  Agregar fracción
                </button>
              </div>
              
              {formData.fracciones?.map((fraccion, index) => (
                <div key={index} className="border rounded p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">Fracción {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeFraccion(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={(formData.fracciones?.length || 0) <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días que saca
                      </label>
                      <input
                        type="number"
                        value={fraccion.dias || 0}
                        onChange={(e) => handleFraccionChange(index, 'dias', e.target.value)}
                        className="w-full p-2 border rounded"
                        min="0"
                        max={formData.diasTotales || 0}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resto
                      </label>
                      <input
                        type="number"
                        value={fraccion.resto || 0}
                        className="w-full p-2 border rounded bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={fraccion.desde || ''}
                        onChange={(e) => handleFraccionChange(index, 'desde', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={fraccion.hasta || ''}
                        onChange={(e) => handleFraccionChange(index, 'hasta', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              disabled={isSubmitting}
              className="bg-[#2d2c55] text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:bg-opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Agregar licencia')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 