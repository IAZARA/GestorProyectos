#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Verificando si el puerto 3000 está en uso...${NC}"

# Verificar si el puerto 3000 está en uso
PORT_PID=$(lsof -i :3000 -t)

if [ -n "$PORT_PID" ]; then
  echo -e "${RED}El puerto 3000 está siendo utilizado por el proceso $PORT_PID${NC}"
  echo -e "${YELLOW}Terminando el proceso...${NC}"
  
  # Intentar terminar el proceso normalmente primero
  kill $PORT_PID 2>/dev/null
  
  # Esperar un momento para que el proceso termine
  sleep 2
  
  # Verificar si el proceso sigue vivo
  if ps -p $PORT_PID > /dev/null; then
    echo -e "${YELLOW}El proceso no respondió, forzando terminación...${NC}"
    kill -9 $PORT_PID 2>/dev/null
    sleep 1
  fi
  
  echo -e "${GREEN}Proceso terminado.${NC}"
else
  echo -e "${GREEN}El puerto 3000 está disponible.${NC}"
fi

# Verificar si el puerto 3001 está en uso (para el servidor WebSocket)
PORT_PID_WS=$(lsof -i :3001 -t)

if [ -n "$PORT_PID_WS" ]; then
  echo -e "${RED}El puerto 3001 (WebSocket) está siendo utilizado por el proceso $PORT_PID_WS${NC}"
  echo -e "${YELLOW}Terminando el proceso...${NC}"
  
  # Intentar terminar el proceso normalmente primero
  kill $PORT_PID_WS 2>/dev/null
  
  # Esperar un momento para que el proceso termine
  sleep 2
  
  # Verificar si el proceso sigue vivo
  if ps -p $PORT_PID_WS > /dev/null; then
    echo -e "${YELLOW}El proceso no respondió, forzando terminación...${NC}"
    kill -9 $PORT_PID_WS 2>/dev/null
    sleep 1
  fi
  
  echo -e "${GREEN}Proceso WebSocket terminado.${NC}"
else
  echo -e "${GREEN}El puerto 3001 (WebSocket) está disponible.${NC}"
fi

# Iniciar el servidor
echo -e "${GREEN}Iniciando el servidor en el puerto 3000...${NC}"
echo -e "${YELLOW}Iniciando el servidor Next.js...${NC}"
npm run dev &
NEXT_PID=$!

echo -e "${YELLOW}Iniciando el servidor WebSocket...${NC}"
node server.js &
WS_PID=$!

echo -e "${GREEN}Servidores iniciados:${NC}"
echo -e "Next.js (puerto 3000): PID $NEXT_PID"
echo -e "WebSocket (puerto 3001): PID $WS_PID"
echo -e "${YELLOW}Presiona Ctrl+C para detener los servidores${NC}"

# Esperar a que el usuario presione Ctrl+C
trap "kill $NEXT_PID $WS_PID 2>/dev/null; echo -e '${RED}Servidores detenidos${NC}'; exit" INT
wait 