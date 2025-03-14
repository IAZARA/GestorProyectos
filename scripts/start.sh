#!/bin/bash

# Script para iniciar toda la aplicación
# Este script inicia tanto el servidor de WebSocket como la aplicación principal

# Colores para la consola
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando la aplicación completa...${NC}"

# Matar procesos existentes en los puertos 3000 y 3001
echo -e "${YELLOW}Verificando y liberando puertos si es necesario...${NC}"
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null

# Iniciar el servidor de WebSocket en segundo plano
echo -e "${CYAN}Iniciando el servidor de WebSocket...${NC}"
node scripts/websocket-server.js > logs/websocket.log 2>&1 &
SOCKET_PID=$!

# Esperar un momento para que el servidor de WebSocket se inicie
echo -e "${CYAN}Esperando a que el servidor de WebSocket se inicie...${NC}"
sleep 2

# Verificar que el servidor de WebSocket se ha iniciado correctamente
if ps -p $SOCKET_PID > /dev/null; then
  echo -e "${GREEN}Servidor de WebSocket iniciado correctamente (PID: $SOCKET_PID)${NC}"
else
  echo -e "${RED}Error al iniciar el servidor de WebSocket${NC}"
  exit 1
fi

# Iniciar la aplicación principal
echo -e "${CYAN}Iniciando la aplicación principal...${NC}"
npm run dev

# Esta parte solo se ejecutará si npm run dev termina
echo -e "${YELLOW}La aplicación principal ha terminado. Deteniendo el servidor de WebSocket...${NC}"
kill $SOCKET_PID

echo -e "${GREEN}Aplicación detenida correctamente.${NC}"
