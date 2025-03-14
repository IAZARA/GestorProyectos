#!/bin/bash

# Script para iniciar el servidor y ejecutar las pruebas
echo "=== Iniciando el servidor y ejecutando pruebas ==="

# Verificar si el servidor ya está en ejecución
if lsof -i:3000 > /dev/null; then
  echo "El servidor ya está en ejecución en el puerto 3000"
else
  echo "Iniciando el servidor en segundo plano..."
  npm run dev &
  SERVER_PID=$!
  
  # Esperar a que el servidor esté listo
  echo "Esperando a que el servidor esté listo..."
  sleep 10
fi

# Ejecutar las pruebas
echo "Ejecutando pruebas de la API..."
node scripts/test-postgres-api.js

# Si iniciamos el servidor, lo detenemos
if [ -n "$SERVER_PID" ]; then
  echo "Deteniendo el servidor..."
  kill $SERVER_PID
fi

echo "=== Pruebas completadas ===" 