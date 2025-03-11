'use client';
import React, { useState, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { Upload, X, File, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  projectId?: string;
  taskId?: string;
  onUploadComplete: (attachmentId: string) => void;
}

export default function FileUploader({ projectId, taskId, onUploadComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useUserStore(state => state.currentUser);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!file || !currentUser) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser.id);
      
      if (projectId) {
        formData.append('projectId', projectId);
      }
      
      if (taskId) {
        formData.append('taskId', taskId);
      }

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }

      const data = await response.json();
      onUploadComplete(data.id);
      setFile(null);
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      setError(error instanceof Error ? error.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Arrastra y suelta un archivo aquí, o haz clic para seleccionar un archivo
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, PDF, DOCX, XLSX hasta 10MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center">
            <File className="h-8 w-8 text-blue-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            <div className="flex space-x-2">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    disabled={uploading}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-600 hover:text-gray-900"
                    disabled={uploading}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 