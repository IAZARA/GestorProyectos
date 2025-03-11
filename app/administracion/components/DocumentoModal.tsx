'use client';
import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useUserStore } from '../../../store/userStore';
import { useAdminStore } from '../../../store/adminStore';

interface DocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentoModal({ isOpen, onClose }: DocumentoModalProps) {
  const { currentUser } = useUserStore();
  const { addDocumento } = useAdminStore();
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'PDF' as 'PDF' | 'WORD' | 'EXCEL' | 'OTRO'
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Determinar tipo de archivo
    let tipo: 'PDF' | 'WORD' | 'EXCEL' | 'OTRO' = 'OTRO';
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      tipo = 'PDF';
    } else if (['doc', 'docx'].includes(extension || '')) {
      tipo = 'WORD';
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      tipo = 'EXCEL';
    }
    
    setFormData(prev => ({ ...prev, tipo }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Simular una carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // URL simulada
      const fakeUrl = `/documentos/${selectedFile.name}`;
      
      // Agregar documento al store
      addDocumento({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        url: fakeUrl,
        subidoPor: currentUser.id,
        tamaño: selectedFile.size
      });
      
      onClose();
    } catch (error) {
      console.error('Error al subir el documento:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Subir documento</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de documento
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="PDF">PDF</option>
                <option value="WORD">Word</option>
                <option value="EXCEL">Excel</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo *
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <p className="text-sm">{selectedFile.name}</p>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="text-gray-400" size={24} />
                    <p className="mt-2 text-sm">Seleccionar archivo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2"
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Subiendo...' : 'Subir documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 