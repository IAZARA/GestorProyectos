'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Save, Edit, Bold, Italic, Underline, List, Heading1, Heading2, Heading3, AlignLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface CollaborativeWikiProps {
  projectId: string;
}

export default function CollaborativeWiki({ projectId }: CollaborativeWikiProps) {
  const { getProjectById, updateProject } = useProjectStore();
  const { getUserById } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

  const insertFormat = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'paragraph':
        formattedText = selectedText;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Reposicionar el cursor después de la inserción
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };
  
  const renderMarkdown = (text: string) => {
    // Una implementación mejorada de renderizado de markdown
    const lines = text.split('\n');
    return (
      <div className="prose max-w-none">
        {lines.map((line, index) => {
          // Procesar negrita
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          // Procesar cursiva
          line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
          // Procesar subrayado
          line = line.replace(/__(.*?)__/g, '<u>$1</u>');
          
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
          } else if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold mt-3 mb-2" dangerouslySetInnerHTML={{ __html: line.substring(3) }} />;
          } else if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: line.substring(4) }} />;
          } else if (line.startsWith('- ')) {
            return <li key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
          } else if (line === '') {
            return <br key={index} />;
          } else {
            return <p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: line }} />;
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
      
      {isEditing && (
        <div className="mb-2 flex flex-wrap gap-1 border rounded p-2 bg-gray-50">
          <button 
            onClick={() => insertFormat('bold')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Negrita"
          >
            <Bold size={18} />
          </button>
          <button 
            onClick={() => insertFormat('italic')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Cursiva"
          >
            <Italic size={18} />
          </button>
          <button 
            onClick={() => insertFormat('underline')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Subrayado"
          >
            <Underline size={18} />
          </button>
          <div className="border-l mx-1 h-8 my-auto"></div>
          <button 
            onClick={() => insertFormat('h1')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Título principal"
          >
            <Heading1 size={18} />
          </button>
          <button 
            onClick={() => insertFormat('h2')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Subtítulo"
          >
            <Heading2 size={18} />
          </button>
          <button 
            onClick={() => insertFormat('h3')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Título de sección"
          >
            <Heading3 size={18} />
          </button>
          <div className="border-l mx-1 h-8 my-auto"></div>
          <button 
            onClick={() => insertFormat('list')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Lista"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => insertFormat('paragraph')} 
            className="p-2 hover:bg-gray-200 rounded" 
            title="Párrafo"
          >
            <AlignLeft size={18} />
          </button>
        </div>
      )}
      
      {isEditing ? (
        <textarea
          ref={textareaRef}
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
      
      <div className="mt-4">
        <button
          onClick={() => setShowFormatHelp(!showFormatHelp)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          <HelpCircle size={16} className="mr-1" />
          Sugerencias de formato
          {showFormatHelp ? (
            <ChevronUp size={16} className="ml-1" />
          ) : (
            <ChevronDown size={16} className="ml-1" />
          )}
        </button>
        
        {showFormatHelp && (
          <div className="mt-2 p-3 bg-gray-50 border rounded text-sm text-gray-600">
            <p className="font-medium mb-1">Formatos disponibles:</p>
            <ul className="list-disc ml-5">
              <li><strong>Negrita</strong>: **texto**</li>
              <li><em>Cursiva</em>: *texto*</li>
              <li><u>Subrayado</u>: __texto__</li>
              <li># Título principal</li>
              <li>## Subtítulo</li>
              <li>### Título de sección</li>
              <li>- Elemento de lista</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 