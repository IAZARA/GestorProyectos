/**
 * Script para actualizar los stores de Zustand
 * Este script reemplaza los stores existentes con versiones que utilizan la API
 * en lugar de localStorage para obtener datos.
 */

const fs = require('fs');
const path = require('path');

// Rutas a los archivos de store
const userStorePath = path.join(process.cwd(), 'store', 'userStore.ts');
const projectStorePath = path.join(process.cwd(), 'store', 'projectStore.ts');

// Verificar si los archivos existen
if (!fs.existsSync(userStorePath)) {
  console.error(`El archivo ${userStorePath} no existe.`);
  process.exit(1);
}

// Crear copias de seguridad
const userStoreBackupPath = `${userStorePath}.backup`;
fs.copyFileSync(userStorePath, userStoreBackupPath);
console.log(`Copia de seguridad creada en: ${userStoreBackupPath}`);

// Leer el nuevo contenido del userStore
const newUserStoreContent = fs.readFileSync(path.join(process.cwd(), 'userStore-db.ts'), 'utf8');

// Escribir el nuevo contenido
fs.writeFileSync(userStorePath, newUserStoreContent);
console.log(`Archivo ${userStorePath} actualizado correctamente.`);

// Verificar si el archivo projectStore existe
if (fs.existsSync(projectStorePath)) {
  // Crear copia de seguridad
  const projectStoreBackupPath = `${projectStorePath}.backup`;
  fs.copyFileSync(projectStorePath, projectStoreBackupPath);
  console.log(`Copia de seguridad creada en: ${projectStoreBackupPath}`);
  
  // Leer el contenido actual
  const projectStoreContent = fs.readFileSync(projectStorePath, 'utf8');
  
  // Modificar el contenido para usar la API
  const updatedProjectStoreContent = projectStoreContent
    // Agregar la versión del store
    .replace(
      /interface ProjectState {/,
      `interface ProjectState {\n  storeVersion: string;`
    )
    // Inicializar la versión del store
    .replace(
      /return {/,
      `return {\n      storeVersion: '1.0.0',`
    )
    // Modificar la función para obtener proyectos
    .replace(
      /const getProjects = \(\) => {[\s\S]*?return projects;[\s\S]*?};/,
      `const getProjects = async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.get('/api/projects');
          const projects = response.data;
          set({ projects, isLoading: false });
          return projects;
        } catch (error) {
          console.error('Error al obtener proyectos:', error);
          set({ error: 'Error al obtener proyectos', isLoading: false });
          return [];
        }
      };`
    )
    // Agregar función para limpiar localStorage
    .replace(
      /export { useProjectStore };/,
      `  // Función para limpiar localStorage
      clearLocalStorage: () => {
        try {
          removeLocalStorage('project-storage');
          console.log('localStorage de proyectos limpiado correctamente');
          
          // Mantener el proyecto actual pero limpiar la lista de proyectos
          set((state) => ({
            projects: [],
            currentProject: state.currentProject,
            storeVersion: '1.0.0'
          }));
          
          // Recargar los proyectos desde la API
          get().getProjects();
        } catch (error) {
          console.error('Error al limpiar localStorage de proyectos:', error);
        }
      }
    };
  },
  {
    name: 'project-storage',
    getStorage: () => ({
      getItem: (name) => {
        try {
          return getLocalStorage(name);
        } catch (error) {
          console.error('Error al obtener del localStorage:', error);
          return null;
        }
      },
      setItem: (name, value) => {
        try {
          setLocalStorage(name, value);
        } catch (error) {
          console.error('Error al guardar en localStorage:', error);
        }
      },
      removeItem: (name) => {
        try {
          removeLocalStorage(name);
        } catch (error) {
          console.error('Error al eliminar del localStorage:', error);
        }
      }
    })
  }
);

export { useProjectStore };`
    );
  
  // Escribir el contenido actualizado
  fs.writeFileSync(projectStorePath, updatedProjectStoreContent);
  console.log(`Archivo ${projectStorePath} actualizado correctamente.`);
}

// Crear el archivo de API para proyectos si no existe
const projectsApiPath = path.join(process.cwd(), 'api-projects.js');
if (!fs.existsSync(projectsApiPath)) {
  const projectsApiContent = `/**
 * API para gestionar proyectos
 * Este archivo crea endpoints para gestionar proyectos y tareas
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./api-auth');

const prisma = new PrismaClient();
const router = express.Router();

// Middleware para parsear JSON
router.use(express.json());

// Middleware para verificar autenticación
router.use(verifyToken);

/**
 * @route GET /api/projects
 * @desc Obtener todos los proyectos
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        assignedUsers: true
      }
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

/**
 * @route GET /api/projects/:id
 * @desc Obtener un proyecto por su ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        assignedUsers: true
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

/**
 * @route POST /api/projects
 * @desc Crear un nuevo proyecto
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    const project = await prisma.project.create({
      data: projectData,
      include: {
        tasks: true,
        assignedUsers: true
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

/**
 * @route PUT /api/projects/:id
 * @desc Actualizar un proyecto existente
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    const project = await prisma.project.update({
      where: { id },
      data: projectData,
      include: {
        tasks: true,
        assignedUsers: true
      }
    });
    
    res.json(project);
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

/**
 * @route DELETE /api/projects/:id
 * @desc Eliminar un proyecto
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

module.exports = router;`;
  
  fs.writeFileSync(projectsApiPath, projectsApiContent);
  console.log(`Archivo ${projectsApiPath} creado correctamente.`);
  
  // Actualizar el archivo api-server.js para incluir la API de proyectos
  const apiServerPath = path.join(process.cwd(), 'api-server.js');
  if (fs.existsSync(apiServerPath)) {
    let apiServerContent = fs.readFileSync(apiServerPath, 'utf8');
    
    // Verificar si ya se ha incluido la API de proyectos
    if (!apiServerContent.includes('const projectRoutes')) {
      // Agregar la importación
      apiServerContent = apiServerContent.replace(
        /const { router: authRoutes, verifyToken } = require\(['"]\.\/api-auth['"]\);/,
        `const { router: authRoutes, verifyToken } = require('./api-auth');\nconst projectRoutes = require('./api-projects');`
      );
      
      // Agregar la ruta
      apiServerContent = apiServerContent.replace(
        /app\.use\(['"]\/api\/users['"]/,
        `app.use('/api/projects', projectRoutes);\napp.use('/api/users'`
      );
      
      // Escribir el contenido actualizado
      fs.writeFileSync(apiServerPath, apiServerContent);
      console.log(`Archivo ${apiServerPath} actualizado para incluir la API de proyectos.`);
    }
  }
}

console.log('Stores actualizados correctamente.');
console.log('Para aplicar los cambios, reinicia la aplicación.');

// Salir con código de éxito
process.exit(0); 