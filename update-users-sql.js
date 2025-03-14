/**
 * Script para actualizar usuarios en la base de datos usando SQL directo
 * Este script actualiza los correos electrónicos de los usuarios existentes
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gestionadcor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function updateUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando actualización de usuarios con SQL directo...');
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Actualizar usuario Iván Zarate
    const updateIvan = await client.query(
      `UPDATE users 
       SET email = 'ivan.zarate@minseg.gob.ar', 
           role = 'Administrador' 
       WHERE first_name = 'Iván' AND last_name = 'Zarate'
       RETURNING *`
    );
    
    if (updateIvan.rowCount > 0) {
      console.log('Usuario Iván Zarate actualizado correctamente.');
    } else {
      console.log('No se encontró el usuario Iván Zarate para actualizar.');
    }
    
    // Actualizar usuario Maxi Scarimbolo
    const updateMaxi = await client.query(
      `UPDATE users 
       SET email = 'maxi.scarimbolo@minseg.gob.ar', 
           role = 'Usuario' 
       WHERE first_name = 'Maxi' AND last_name = 'Scarimbolo'
       RETURNING *`
    );
    
    if (updateMaxi.rowCount > 0) {
      console.log('Usuario Maxi Scarimbolo actualizado correctamente.');
    } else {
      console.log('No se encontró el usuario Maxi Scarimbolo para actualizar.');
    }
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    // Verificar usuarios actualizados
    const allUsers = await client.query('SELECT * FROM users');
    console.log('Usuarios en la base de datos después de la actualización:');
    console.table(allUsers.rows);
    
    console.log('Actualización de usuarios completada con éxito.');
  } catch (error) {
    // Revertir transacción en caso de error
    await client.query('ROLLBACK');
    console.error('Error al actualizar usuarios:', error);
  } finally {
    // Liberar el cliente
    client.release();
    // Cerrar el pool de conexiones
    await pool.end();
  }
}

// Ejecutar la función
updateUsers();
