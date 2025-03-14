/**
 * API endpoint para obtener, actualizar y eliminar usuarios por ID
 */

const { userService } = require('../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID de usuario no proporcionado' });
  }
  
  // Manejar diferentes métodos HTTP
  switch (req.method) {
    case 'GET':
      return await getUserById(req, res, id);
    case 'PUT':
      return await updateUser(req, res, id);
    case 'DELETE':
      return await deleteUser(req, res, id);
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 */
async function getUserById(req, res, id) {
  try {
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
}

/**
 * Actualizar un usuario
 * PUT /api/users/:id
 * Body: { first_name, last_name, email, role }
 */
async function updateUser(req, res, id) {
  try {
    // Verificar si el usuario existe
    const existingUser = await userService.getUserById(id);
    
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario
    const updatedData = {
      ...req.body,
      updated_at: new Date()
    };
    
    const [updatedUser] = await userService.updateUser(id, updatedData);
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
}

/**
 * Eliminar un usuario
 * DELETE /api/users/:id
 */
async function deleteUser(req, res, id) {
  try {
    // Verificar si el usuario existe
    const existingUser = await userService.getUserById(id);
    
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Eliminar usuario
    await userService.deleteUser(id);
    
    return res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
} 