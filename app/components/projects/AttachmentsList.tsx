'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Upload, File, FileText, Download, Trash, Image, FileArchive, FileCode } from 'lucide-react';
import { downloadAttachment, uploadAttachment } from '../../../lib/api';

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  userId: string;
  projectId: string;
  createdAt: Date;
}

interface AttachmentsListProps {
  projectId: string;
}

export default function AttachmentsList({ projectId }: AttachmentsListProps) {
  const { getProjectById, addAttachment, deleteAttachment } = useProjectStore();
  const { currentUser } = useUserStore();
  const [project, setProject] = useState<any>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Cargar el proyecto y sus archivos adjuntos
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          setAttachments(projectData.attachments || []);
        }
      } catch (error) {
        console.error('Error al cargar el proyecto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProjectById]);

  // Función para subir archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length || !currentUser) return;

    setUploading(true);
    const file = files[0];

    // Preparar FormData para la carga
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('userId', currentUser.id);

    // Subir el archivo
    uploadAttachment(formData)
      .then(attachmentData => {
        // Añadir al store
        addAttachment(projectId, {
          ...attachmentData,
          userId: currentUser.id
        });

        // Actualizar el estado local
        const updatedProject = getProjectById(projectId);
        if (updatedProject) {
          setProject(updatedProject);
          setAttachments(updatedProject.attachments || []);
        }

        // Limpiar el input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      })
      .catch(error => {
        console.error('Error al subir el archivo:', error);
        alert('Hubo un error al subir el archivo. Por favor, inténtalo de nuevo.');
      })
      .finally(() => {
        setUploading(false);
      });
  };

  // Función para descargar archivos
  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Hubo un error al descargar el archivo. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para eliminar archivos
  const handleDelete = (attachmentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este archivo?')) {
      deleteAttachment(projectId, attachmentId);

      // Actualizar el estado local
      const updatedProject = getProjectById(projectId);
      if (updatedProject) {
        setProject(updatedProject);
        setAttachments(updatedProject.attachments || []);
      }
    }
  };

  // Determinar el icono según el tipo de archivo
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image size={20} className="text-blue-600" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText size={20} className="text-red-600" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      return <FileArchive size={20} className="text-yellow-600" />;
    } else if (mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('json')) {
      return <FileCode size={20} className="text-green-600" />;
    } else {
      return <File size={20} className="text-gray-600" />;
    }
  };

  // Filtrar archivos por término de búsqueda
  const filteredAttachments = attachments.filter(attachment => 
    attachment.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Documentos Adjuntos</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="mr-2">Subiendo...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              </>
            ) : (
              <>
                <Upload size={16} className="mr-1" /> Subir Archivo
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar archivos..."
          className="w-full p-2 border rounded"
        />
      </div>
      
      {/* Lista de archivos */}
      {filteredAttachments.length > 0 ? (
        <div className="border rounded divide-y">
          {filteredAttachments.map((attachment) => (
            <div key={attachment.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="mr-3">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <div>
                  <p className="font-medium">{attachment.originalName}</p>
                  <div className="flex text-xs text-gray-500 mt-1">
                    <span className="mr-3">{formatFileSize(attachment.size)}</span>
                    <span>Subido el {formatDate(attachment.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded bg-gray-50">
          {searchTerm ? (
            <p className="text-gray-500">No se encontraron archivos que coincidan con "{searchTerm}"</p>
          ) : (
            <>
              <FileText size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No hay archivos adjuntos en este proyecto</p>
              <p className="text-sm text-gray-400 mt-2">Haz clic en "Subir Archivo" para añadir documentos</p>
            </>
          )}
        </div>
      )}
    </div>
  );
} 