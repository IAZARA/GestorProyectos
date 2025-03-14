#!/bin/bash

# Iniciar el servidor WebSocket en segundo plano
echo "Iniciando servidor WebSocket..."
node websocket-server.js &
WEBSOCKET_PID=$!

# Esperar un momento para que el servidor WebSocket se inicie
sleep 2

# Iniciar el servidor Next.js
echo "Iniciando servidor Next.js..."
npm run dev

# Al terminar, matar el proceso del servidor WebSocket
kill $WEBSOCKET_PID 