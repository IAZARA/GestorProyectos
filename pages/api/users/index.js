/**
 * API endpoint para obtener y crear usuarios
 */

const { userService } = require('../../../lib/db');
const { v4: uuidv4 } = require('uuid');

export default async function handler(req, res) {
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getUsers(req, res);
    case 'POST':
      return await createUser(req, res);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener usuarios
 * GET /api/users
 */
async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
}

/**
 * Crear un nuevo usuario
 * POST /api/users
 * Body: { first_name, last_name, email, role }
 */
async function createUser(req, res) {
  try {
    const { first_name, last_name, email, role } = req.body;
    
    // Validar datos requeridos
    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }
    
    // Crear usuario
    const user = {
      id: uuidv4(),
      first_name,
      last_name,
      email,
      role,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const [createdUser] = await userService.createUser(user);
    
    return res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
} 