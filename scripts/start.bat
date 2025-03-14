@echo off
REM Script para iniciar toda la aplicación en Windows
REM Este script inicia tanto el servidor de WebSocket como la aplicación principal

echo [92mIniciando la aplicación completa...[0m

REM Crear directorio de logs si no existe
if not exist logs mkdir logs

REM Matar procesos existentes en los puertos 3000 y 3001
echo [93mVerificando y liberando puertos si es necesario...[0m
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul

REM Iniciar el servidor de WebSocket en segundo plano
echo [96mIniciando el servidor de WebSocket...[0m
start /B cmd /c "node scripts/websocket-server.js > logs/websocket.log 2>&1"

REM Esperar un momento para que el servidor de WebSocket se inicie
echo [96mEsperando a que el servidor de WebSocket se inicie...[0m
timeout /t 2 /nobreak > nul

REM Verificar que el servidor de WebSocket se ha iniciado correctamente
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
  echo [92mServidor de WebSocket iniciado correctamente[0m
) else (
  echo [91mError al iniciar el servidor de WebSocket[0m
  exit /b 1
)

REM Iniciar la aplicación principal
echo [96mIniciando la aplicación principal...[0m
npm run dev

REM Esta parte solo se ejecutará si npm run dev termina
echo [93mLa aplicación principal ha terminado. Deteniendo el servidor de WebSocket...[0m
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul

echo [92mAplicación detenida correctamente.[0m 