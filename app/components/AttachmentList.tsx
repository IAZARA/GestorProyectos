'use client';
import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { File, Download, Trash2, Loader2 } from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface AttachmentListProps {
  projectId?: string;
  taskId?: string;
  onDelete?: (attachmentId: string) => void;
}

export default function AttachmentList({ projectId, taskId, onDelete }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const currentUser = useUserStore(state => state.currentUser);

  useEffect(() => {
    const fetchAttachments = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = '/api/attachments';
        if (projectId) {
          url += `?projectId=${projectId}`;
        } else if (taskId) {
          url += `?taskId=${taskId}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Error al cargar los archivos adjuntos');
        }

        const data = await response.json();
        setAttachments(data);
      } catch (error) {
        console.error('Error al cargar los archivos adjuntos:', error);
        setError('Error al cargar los archivos adjuntos');
      } finally {
        setLoading(false);
      }
    };

    if (projectId || taskId) {
      fetchAttachments();
    }
  }, [projectId, taskId]);

  const handleDelete = async (attachmentId: string) => {
    if (!currentUser) return;
    
    setDeleting(attachmentId);
    
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el archivo');
      }
      
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      
      if (onDelete) {
        onDelete(attachmentId);
      }
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      setError('Error al eliminar el archivo');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (attachmentId: string, originalName: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/download`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      setError('Error al descargar el archivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    // Simplificado, se podría expandir con más tipos de archivos
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else {
      return '📁';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        {error}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No hay archivos adjuntos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map(attachment => (
        <div key={attachment.id} className="border rounded-lg p-3 hover:bg-gray-50">
          <div className="flex items-center">
            <div className="text-2xl mr-3">
              {getFileIcon(attachment.mimeType)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.originalName}
              </p>
              <div className="flex text-xs text-gray-500 space-x-3">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span>{formatDate(attachment.createdAt)}</span>
                <span>•</span>
                <span>
                  {attachment.user.firstName} {attachment.user.lastName}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleDownload(attachment.id, attachment.originalName)}
                className="text-gray-600 hover:text-gray-900"
                title="Descargar"
              >
                <Download className="h-5 w-5" />
              </button>
              
              {(currentUser?.id === attachment.user.id || currentUser?.role === 'Administrador') && (
                deleting === attachment.id ? (
                  <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 