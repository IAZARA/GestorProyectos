#!/bin/bash

# Script de despliegue para la aplicación de Gestión de Proyectos
# Este script debe ejecutarse en el servidor de producción

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando despliegue de la aplicación...${NC}"

# Directorio de la aplicación
APP_DIR="/var/www/gestor-proyectos"

# Verificar si el directorio existe
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}Error: El directorio $APP_DIR no existe.${NC}"
  exit 1
fi

# Ir al directorio de la aplicación
cd $APP_DIR

echo -e "${YELLOW}Actualizando código desde el repositorio...${NC}"
# Guardar cambios locales si existen
git stash

# Actualizar desde el repositorio
git pull

# Aplicar cambios locales si existían
git stash pop || true

echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install --production

echo -e "${YELLOW}Compilando archivos TypeScript...${NC}"
npx tsc server/socket.ts --outDir server --esModuleInterop --target es2016 --module commonjs
npx tsc lib/prisma.ts --outDir lib --esModuleInterop --target es2016 --module commonjs
npx tsc lib/socket.ts --outDir lib --esModuleInterop --target es2016 --module commonjs

echo -e "${YELLOW}Construyendo la aplicación...${NC}"
npm run build

echo -e "${YELLOW}Sincronizando usuarios con la base de datos...${NC}"
node scripts/sync-users.js

echo -e "${YELLOW}Reiniciando la aplicación con PM2...${NC}"
pm2 restart gestor-proyectos

echo -e "${GREEN}¡Despliegue completado con éxito!${NC}"
echo -e "${YELLOW}Verificando estado de la aplicación:${NC}"
pm2 status gestor-proyectos

echo -e "${YELLOW}Logs recientes:${NC}"
pm2 logs gestor-proyectos --lines 10 