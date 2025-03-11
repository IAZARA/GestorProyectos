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
    
    // Simulamos la carga de archivos (en una aplicación real, esto subiría los archivos a un servidor)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Crear un objeto de adjunto simulado
      const attachment = {
        fileName: `file-${Date.now()}-${i}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: URL.createObjectURL(file), // En una app real, esta sería la URL del servidor
        userId: currentUser.id,
        projectId
      };
      
      // Añadir el adjunto al proyecto
      addAttachment(projectId, attachment);
    }
    
    setIsUploading(false);
    
    // Limpiar el input de archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                <a 
                  href={attachment.path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline block truncate"
                >
                  {attachment.originalName}
                </a>
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