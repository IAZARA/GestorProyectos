'use client';
import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { File, FileText, FileSpreadsheet, FileIcon, Trash2, Upload } from 'lucide-react';

interface AttachmentsListProps {
  projectId: string;
}

export default function AttachmentsList({ projectId }: AttachmentsListProps) {
  const { getProjectById, addAttachment, deleteAttachment } = useProjectStore();
  const { currentUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const project = getProjectById(projectId);
  
  if (!project || !currentUser) return null;
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Obtener la URL base de la API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Crear un FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('userId', currentUser.id);
        
        // Enviar el archivo al servidor
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Error al subir el archivo: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Crear un objeto de adjunto con los datos devueltos por el servidor
        const attachment = {
          id: data.id || `temp-${Date.now()}-${i}`,
          fileName: data.fileName || `file-${Date.now()}-${i}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: data.path || data.url || URL.createObjectURL(file),
          userId: currentUser.id,
          projectId
        };
        
        // Añadir el adjunto al proyecto
        addAttachment(projectId, attachment);
        console.log(`Archivo subido exitosamente: ${attachment.originalName}`);
      }
    } catch (error) {
      console.error('Error al subir los archivos:', error);
      alert('Error al subir los archivos. Por favor, inténtelo de nuevo.');
    } finally {
      setIsUploading(false);
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      deleteAttachment(projectId, attachmentId);
    }
  };
  
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="text-red-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) {
      return <FileSpreadsheet className="text-green-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="text-blue-500" />;
    } else {
      return <File className="text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Documentos adjuntos</h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Upload size={16} className="mr-2" />
            {isUploading ? 'Subiendo...' : 'Subir archivos'}
          </button>
        </div>
      </div>
      
      {project.attachments && project.attachments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="border rounded-lg p-4 flex items-start"
            >
              <div className="mr-3">
                {getFileIcon(attachment.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <button 
                  onClick={() => {
                    try {
                      // Construir la URL con el puerto correcto (3005 para la API)
                      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
                      
                      // Usar la API de descarga para archivos reales
                      if (attachment.id) {
                        const downloadUrl = `${API_BASE_URL}/api/attachments/${attachment.id}/download`;
                        console.log(`Intentando descargar archivo: ${attachment.originalName} (ID: ${attachment.id})`);
                        console.log(`URL de descarga: ${downloadUrl}`);
                        
                        // Verificar si el archivo existe antes de abrir una nueva pestaña
                        fetch(downloadUrl, { method: 'HEAD' })
                          .then(response => {
                            if (response.ok) {
                              window.open(downloadUrl, '_blank');
                            } else {
                              console.error(`Error al verificar el archivo: ${response.status} ${response.statusText}`);
                              alert(`No se pudo descargar el archivo "${attachment.originalName}". Por favor, inténtelo de nuevo más tarde.`);
                            }
                          })
                          .catch(error => {
                            console.error('Error al verificar el archivo:', error);
                            alert(`Error al descargar el archivo. Por favor, inténtelo de nuevo más tarde.`);
                          });
                      } else {
                        // Fallback para archivos simulados (solo en desarrollo)
                        window.open(attachment.path, '_blank');
                      }
                    } catch (error) {
                      console.error('Error al iniciar la descarga:', error);
                      alert('Ocurrió un error al intentar descargar el archivo.');
                    }
                  }}
                  className="font-medium text-blue-600 hover:underline block truncate text-left"
                >
                  {attachment.originalName}
                </button>
                <p className="text-sm text-gray-500">
                  {(attachment.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => handleDeleteAttachment(attachment.id)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No hay documentos adjuntos</p>
          <p className="text-sm mt-2">Haz clic en "Subir archivos" para añadir documentos al proyecto</p>
        </div>
      )}
    </div>
  );
} 