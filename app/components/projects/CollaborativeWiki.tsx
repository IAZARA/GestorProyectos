'use client';
import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Save, Edit } from 'lucide-react';

interface CollaborativeWikiProps {
  projectId: string;
}

export default function CollaborativeWiki({ projectId }: CollaborativeWikiProps) {
  const { getProjectById, updateProject } = useProjectStore();
  const { getUserById } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  
  const project = getProjectById(projectId);
  
  useEffect(() => {
    if (project && project.wikiContent) {
      setContent(project.wikiContent);
    } else {
      setContent('# Documentación del Proyecto\n\nUtiliza este espacio para documentar información importante sobre el proyecto.');
    }
  }, [project]);
  
  if (!project) return null;
  
  const handleSave = () => {
    updateProject(projectId, { wikiContent: content });
    setIsEditing(false);
  };
  
  const renderMarkdown = (text: string) => {
    // Una implementación muy básica de renderizado de markdown
    // En una aplicación real, usarías una biblioteca como marked o remark
    const lines = text.split('\n');
    return (
      <div className="prose max-w-none">
        {lines.map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
          } else if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.substring(3)}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold mt-3 mb-1">{line.substring(4)}</h3>;
          } else if (line.startsWith('- ')) {
            return <li key={index} className="ml-4">{line.substring(2)}</li>;
          } else if (line === '') {
            return <br key={index} />;
          } else {
            return <p key={index} className="my-2">{line}</p>;
          }
        })}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium">Wiki del Proyecto</h3>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {isEditing ? (
            <>
              <Save size={16} className="mr-1" />
              Guardar
            </>
          ) : (
            <>
              <Edit size={16} className="mr-1" />
              Editar
            </>
          )}
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 p-4 border rounded font-mono"
          placeholder="Escribe aquí la documentación del proyecto..."
        />
      ) : (
        <div className="border rounded-lg p-4 min-h-96 bg-gray-50">
          {renderMarkdown(content)}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Sugerencias de formato:</p>
        <ul className="list-disc ml-5 mt-1">
          <li># Título principal</li>
          <li>## Subtítulo</li>
          <li>### Título de sección</li>
          <li>- Elemento de lista</li>
        </ul>
      </div>
    </div>
  );
} 