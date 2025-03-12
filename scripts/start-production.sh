#!/bin/bash
# Script para iniciar la aplicación en producción

# Matar procesos en puertos 3000 y 3001 si existen
echo "Verificando puertos..."
node scripts/kill-ports.js

# Iniciar el servidor
echo "Iniciando servidor..."
PORT=3000 NODE_ENV=production node server.js
