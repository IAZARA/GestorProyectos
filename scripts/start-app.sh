#!/bin/bash

# Script para iniciar la aplicación con la base de datos PostgreSQL

echo "=== Iniciando la aplicación con PostgreSQL ==="

# Verificar que la base de datos PostgreSQL esté en ejecución
echo -e "\n=== Verificando la conexión a PostgreSQL ==="
node -e "
const { Client } = require('pg');
require('dotenv').config();

async function checkConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestionadcor'
  });
  
  try {
    await client.connect();
    console.log('Conexión a PostgreSQL establecida correctamente');
    await client.end();
    return true;
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error.message);
    return false;
  }
}

checkConnection().then(success => {
  if (!success) {
    console.error('No se pudo conectar a PostgreSQL. Asegúrate de que el servidor esté en ejecución.');
    process.exit(1);
  }
});
"

# Si la conexión falló, salir
if [ $? -ne 0 ]; then
  echo "Error al conectar a PostgreSQL. Saliendo..."
  exit 1
fi

# Iniciar la aplicación
echo -e "\n=== Iniciando la aplicación ==="
npm run dev 