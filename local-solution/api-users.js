/**
 * API para obtener usuarios directamente de la base de datos PostgreSQL
 * Este archivo crea endpoints para gestionar usuarios
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const prisma = new PrismaClient();
const router = express.Router();

// Middleware para parsear JSON
router.use(express.json());
router.use(cors());

/**
 * @route GET /api/users
 * @desc Obtener todos los usuarios
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('Obteniendo usuarios de la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        photoUrl: true,
        password: true
      }
    });
    
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Obtener un usuario por su ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        photoUrl: true,
        password: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

/**
 * @route POST /api/users
 * @desc Crear un nuevo usuario
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }
    
    // Crear el usuario
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        photoUrl: true,
        password: true
      }
    });
    
    console.log(`Usuario creado con ID: ${user.id}`);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Actualizar un usuario existente
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Si se actualiza el email, verificar que no esté en uso
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (emailExists) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }
    
    // Si se actualiza la contraseña, encriptarla
    if (userData.password) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    // Actualizar el usuario
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        expertise: true,
        photoUrl: true,
        password: true
      }
    });
    
    console.log(`Usuario actualizado con ID: ${user.id}`);
    res.json(user);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Eliminar un usuario
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar el usuario
    await prisma.user.delete({
      where: { id }
    });
    
    console.log(`Usuario eliminado con ID: ${id}`);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router; 