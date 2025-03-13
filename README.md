# Gestor de Proyectos

Sistema de gestión de proyectos con notificaciones en tiempo real.

## Requisitos

- Node.js 18 o superior
- Docker y Docker Compose
- PostgreSQL (se puede usar a través de Docker)

## Despliegue en Digital Ocean

### Paso 1: Crear un Droplet

1. Inicia sesión en tu cuenta de Digital Ocean
2. Crea un nuevo Droplet con las siguientes especificaciones:
   - **Distribución**: Ubuntu 22.04 LTS
   - **Plan**: Basic (recomendado mínimo 2GB RAM / 1 CPU)
   - **Región**: Elige la más cercana a tus usuarios
   - **Autenticación**: SSH Keys (recomendado) o Password

### Paso 2: Conectarse al Droplet

```bash
ssh root@IP_DEL_DROPLET
```

### Paso 3: Clonar el Repositorio

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Git
apt install git -y

# Clonar el repositorio
git clone https://github.com/tu-usuario/gestionadcor.git
cd gestionadcor
```

### Paso 4: Ejecutar el Script de Configuración

```bash
# Dar permisos de ejecución al script
chmod +x setup.sh

# Ejecutar el script
sudo ./setup.sh
```

El script realizará automáticamente las siguientes acciones:

1. Instalar todas las dependencias necesarias (Node.js, Docker, Docker Compose, etc.)
2. Configurar las variables de entorno
3. Iniciar la base de datos PostgreSQL en Docker
4. Ejecutar las migraciones de Prisma
5. Inicializar la base de datos con el usuario administrador (Ivan Zarate)
6. Construir la aplicación
7. Configurar PM2 para mantener la aplicación en ejecución
8. Opcionalmente, configurar Nginx como proxy inverso
9. Opcionalmente, configurar SSL con Certbot

### Paso 5: Acceder a la Aplicación

Una vez completada la configuración, puedes acceder a la aplicación de las siguientes maneras:

- **Localmente**: http://localhost:3000
- **Remotamente**: http://IP_DEL_DROPLET (si configuraste Nginx)
- **Con dominio y SSL**: https://tu-dominio.com (si configuraste Nginx y SSL)

### Credenciales de Acceso

- **Email**: ivan.zarate@minseg.gob.ar
- **Contraseña**: Vortex733-

## Comandos Útiles

### Iniciar la Aplicación Manualmente

```bash
./start.sh
```

### Gestionar la Aplicación con PM2

```bash
# Ver estado de la aplicación
pm2 status

# Reiniciar la aplicación
pm2 restart gestionadcor

# Ver logs
pm2 logs gestionadcor

# Detener la aplicación
pm2 stop gestionadcor
```

### Gestionar la Base de Datos

```bash
# Ver contenedores en ejecución
docker ps

# Ver logs de la base de datos
docker logs gestionadcor-postgres

# Detener la base de datos
docker-compose stop

# Iniciar la base de datos
docker-compose up -d
```

## Solución de Problemas

### La aplicación no inicia

Verifica los logs de la aplicación:

```bash
pm2 logs gestionadcor
```

### Problemas con la base de datos

Verifica que el contenedor de PostgreSQL esté en ejecución:

```bash
docker ps
```

Si no aparece, inicia la base de datos:

```bash
docker-compose up -d
```

### Reiniciar todo el sistema

```bash
# Detener la aplicación
pm2 stop gestionadcor

# Detener la base de datos
docker-compose down

# Iniciar la base de datos
docker-compose up -d

# Esperar a que la base de datos esté lista
sleep 5

# Iniciar la aplicación
pm2 start gestionadcor
```

## Actualización de la Aplicación

Para actualizar la aplicación con nuevos cambios:

```bash
# Detener la aplicación
pm2 stop gestionadcor

# Obtener los últimos cambios
git pull

# Instalar dependencias
npm install

# Ejecutar migraciones si es necesario
npx prisma migrate deploy

# Construir la aplicación
npm run build

# Iniciar la aplicación
pm2 start gestionadcor
``` 