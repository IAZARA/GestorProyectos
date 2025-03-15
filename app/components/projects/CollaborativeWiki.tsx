'use client';
import React, { useState, useEffect } from 'react';
import { useProjectStore, syncProjectStore } from '../../../store/projectStore';
import { useUserStore } from '../../../store/userStore';
import { Save, Edit2 } from 'lucide-react';

interface CollaborativeWikiProps {
  projectId: string;
}

export default function CollaborativeWiki({ projectId }: CollaborativeWikiProps) {
  const { getProjectById, updateProject } = useProjectStore();
  const { currentUser } = useUserStore();
  const [project, setProject] = useState<any>(null);
  const [wikiContent, setWikiContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  const [lastEditTime, setLastEditTime] = useState<Date | null>(null);

  // Cargar el proyecto y el contenido de la wiki
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          setWikiContent(projectData.wikiContent || '# Wiki del Proyecto\n\nComienza a documentar tu proyecto aquí...');
          
          // Guardar datos sobre la última edición si existen
          if (projectData.wikiLastEditor) {
            setLastEditor(projectData.wikiLastEditor);
          }
          if (projectData.wikiLastEdited) {
            setLastEditTime(new Date(projectData.wikiLastEdited));
          }
        }
      } catch (error) {
        console.error('Error al cargar el proyecto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProjectById]);

  // Sincronizar el store para forzar la persistencia
  const syncStore = () => {
    // Usar función global de sincronización
    syncProjectStore();
    console.log("Wiki: Store sincronizado");
  };

  const handleSaveWiki = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      // Actualizar el proyecto con el nuevo contenido de la wiki
      await updateProject(projectId, {
        wikiContent: wikiContent,
        wikiLastEditor: currentUser.id,
        wikiLastEdited: new Date()
      });
      
      // Actualizar la información del último editor
      setLastEditor(currentUser.id);
      setLastEditTime(new Date());
      
      setIsEditing(false);
      
      // Forzar la sincronización del store para persistir
      syncStore();
      
      // Actualizar el proyecto local
      const updatedProject = getProjectById(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error al guardar la wiki:', error);
      alert('Hubo un error al guardar los cambios. Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Función para convertir el Markdown en HTML
  const renderMarkdown = (text: string) => {
    // Manejar encabezados
    let html = text
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3 mt-5">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 class="text-base font-bold mb-2 mt-3">$1</h4>');

    // Manejar listas
    html = html
      .replace(/^\* (.*$)/gm, '<li class="ml-6 mb-1 list-disc">$1</li>')
      .replace(/^\- (.*$)/gm, '<li class="ml-6 mb-1 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-6 mb-1 list-decimal">$1</li>');

    // Agrupar listas
    html = html
      .replace(/<\/li>\n<li class="ml-6 mb-1 list-disc">/g, '</li><li class="ml-6 mb-1 list-disc">')
      .replace(/<\/li>\n<li class="ml-6 mb-1 list-decimal">/g, '</li><li class="ml-6 mb-1 list-decimal">');
    
    html = html
      .replace(/(<li class="ml-6 mb-1 list-disc">.*<\/li>)/g, '<ul class="mb-4">$1</ul>')
      .replace(/(<li class="ml-6 mb-1 list-decimal">.*<\/li>)/g, '<ol class="mb-4">$1</ol>');

    // Manejar énfasis (negrita e itálica)
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Manejar enlaces
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>');

    // Manejar bloques de código
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded font-mono text-sm mb-4 whitespace-pre-wrap">$1</pre>');

    // Manejar código en línea
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>');

    // Manejar párrafos
    html = html
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^([^<].*)/gm, '<p class="mb-4">$1</p>');

    // Limpiar cualquier párrafo innecesario
    html = html
      .replace(/<p class="mb-4"><\/p>/g, '')
      .replace(/<p class="mb-4"><h/g, '<h')
      .replace(/<p class="mb-4"><ul/g, '<ul')
      .replace(/<p class="mb-4"><ol/g, '<ol')
      .replace(/<p class="mb-4"><pre/g, '<pre')
      .replace(/<\/h\d><\/p>/g, '</h1>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<\/ol><\/p>/g, '</ol>')
      .replace(/<\/pre><\/p>/g, '</pre>');

    return html;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <h2 className="text-xl font-medium">Wiki Colaborativa</h2>
        <div>
          {isEditing ? (
            <button
              onClick={handleSaveWiki}
              disabled={saving}
              className="flex items-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="mr-2">Guardando...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" /> Guardar Cambios
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
            >
              <Edit2 size={16} className="mr-1" /> Editar Wiki
            </button>
          )}
        </div>
      </div>
      
      {lastEditTime && (
        <div className="mb-4 text-sm text-gray-500">
          Última edición: {formatDate(lastEditTime)}
          {lastEditor && ` por ${lastEditor === currentUser?.id ? 'ti' : 'un colaborador'}`}
        </div>
      )}
      
      {isEditing ? (
        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-600">
            Soporta formato Markdown: # Encabezado, ## Subencabezado, **negrita**, *itálica*, - lista, etc.
          </div>
          <textarea
            value={wikiContent}
            onChange={(e) => setWikiContent(e.target.value)}
            className="w-full h-96 p-4 border rounded font-mono text-sm"
            placeholder="Comienza a documentar tu proyecto aquí..."
          />
        </div>
      ) : (
        <div 
          className="prose max-w-none mb-6 p-4 bg-gray-50 rounded min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(wikiContent) }}
        />
      )}
      
      {isEditing && (
        <div className="mt-4 p-4 bg-yellow-50 rounded text-sm">
          <p className="font-medium text-yellow-700">Consejos para la Wiki:</p>
          <ul className="list-disc ml-5 mt-2 text-yellow-700">
            <li>Utiliza # para encabezados principales y ## para subencabezados</li>
            <li>Crea listas utilizando - o * al principio de cada línea</li>
            <li>Utiliza **texto** para texto en negrita y *texto* para cursiva</li>
            <li>Para enlaces: [texto del enlace](http://url.com)</li>
            <li>Para código: `código en línea` o bloques con ```</li>
          </ul>
        </div>
      )}
    </div>
  );
} 