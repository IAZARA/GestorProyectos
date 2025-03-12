# Guía de Despliegue en Digital Ocean

Esta guía te ayudará a desplegar la aplicación de Gestión de Proyectos en un Droplet de Digital Ocean.

## Requisitos previos

- Una cuenta en [Digital Ocean](https://www.digitalocean.com/)
- Conocimientos básicos de línea de comandos y SSH
- Dominio (opcional, pero recomendado para HTTPS)

## Paso 1: Crear un Droplet en Digital Ocean

1. Inicia sesión en tu cuenta de Digital Ocean
2. Haz clic en "Create" y selecciona "Droplets"
3. Selecciona la siguiente configuración:
   - **Imagen**: Ubuntu 22.04 LTS
   - **Plan**: Basic (2GB RAM / 1 CPU como mínimo recomendado)
   - **Región**: Selecciona la más cercana a tus usuarios
   - **Autenticación**: SSH Keys (recomendado) o Password
   - **Hostname**: Nombre para identificar tu droplet (ej. gestor-proyectos)
4. Haz clic en "Create Droplet"

## Paso 2: Conectarse al Droplet

Una vez creado el Droplet, conéctate a él mediante SSH:

```bash
ssh root@TU_IP_DEL_DROPLET
```

## Paso 3: Instalar dependencias

Actualiza el sistema e instala las dependencias necesarias:

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar la instalación
node -v
npm -v

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Git
apt install -y git

# Instalar PM2 (gestor de procesos para Node.js)
npm install -g pm2
```

## Paso 4: Configurar PostgreSQL

Configura la base de datos PostgreSQL:

```bash
# Cambiar al usuario postgres
sudo -i -u postgres

# Crear un usuario para la aplicación
createuser --interactive --pwprompt
# Nombre: gestor_app
# Contraseña: [ingresa una contraseña segura]
# ¿Usuario es superusuario? No
# ¿Puede crear bases de datos? Sí
# ¿Puede crear roles? No

# Crear la base de datos
createdb gestor_proyectos

# Salir del usuario postgres
exit
```

## Paso 5: Clonar el repositorio

Clona el repositorio de la aplicación:

```bash
# Crear directorio para la aplicación
mkdir -p /var/www
cd /var/www

# Clonar el repositorio
git clone TU_URL_DEL_REPOSITORIO gestor-proyectos
cd gestor-proyectos

# Instalar dependencias
npm install --production
```

## Paso 6: Configurar variables de entorno

Crea y configura el archivo `.env.production`:

```bash
# Crear archivo .env.production
nano .env.production
```

Añade el siguiente contenido (ajustando los valores según tu configuración):

```
DATABASE_URL="postgresql://gestor_app:TU_CONTRASEÑA@localhost:5432/gestor_proyectos?schema=public"
NEXTAUTH_SECRET="un_secreto_muy_seguro_para_produccion"
NEXTAUTH_URL="  http://TU_IP_DEL_DROPLET:3000"
UPLOAD_DIR="./uploads"
```

## Paso 7: Preparar la aplicación para producción

Ejecuta el script de preparación para producción:

```bash
# Compilar archivos TypeScript
npx tsc server/socket.ts --outDir server --esModuleInterop --target es2016 --module commonjs
npx tsc lib/prisma.ts --outDir lib --esModuleInterop --target es2016 --module commonjs
npx tsc lib/socket.ts --outDir lib --esModuleInterop --target es2016 --module commonjs

# Construir la aplicación
npm run build
```

## Paso 8: Configurar PM2 para gestionar la aplicación

Configura PM2 para mantener la aplicación en ejecución:

```bash
# Crear archivo de configuración para PM2
nano ecosystem.config.js
```

Añade el siguiente contenido:

```javascript
module.exports = {
  apps: [
    {
      name: 'gestor-proyectos',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

Inicia la aplicación con PM2:

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar automáticamente después de un reinicio
pm2 startup
pm2 save
```

## Paso 9: Configurar Nginx como proxy inverso (opcional pero recomendado)

Instala y configura Nginx:

```bash
# Instalar Nginx
apt install -y nginx

# Configurar Nginx
nano /etc/nginx/sites-available/gestor-proyectos
```

Añade la siguiente configuración:

```nginx
server {
    listen 80;
    server_name TU_DOMINIO_O_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa la configuración y reinicia Nginx:

```bash
# Crear enlace simbólico
ln -s /etc/nginx/sites-available/gestor-proyectos /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

## Paso 10: Configurar firewall (opcional pero recomendado)

Configura el firewall para permitir solo el tráfico necesario:

```bash
# Instalar UFW si no está instalado
apt install -y ufw

# Configurar reglas
ufw allow ssh
ufw allow http
ufw allow https

# Activar firewall
ufw enable
```

## Paso 11: Configurar HTTPS con Certbot (opcional pero recomendado)

Si tienes un dominio, configura HTTPS con Let's Encrypt:

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado
certbot --nginx -d TU_DOMINIO

# Configurar renovación automática
certbot renew --dry-run
```

## Solución de problemas

### Verificar logs de la aplicación

```bash
# Ver logs de PM2
pm2 logs

# Ver logs de Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Reiniciar servicios

```bash
# Reiniciar la aplicación
pm2 restart gestor-proyectos

# Reiniciar Nginx
systemctl restart nginx

# Reiniciar PostgreSQL
systemctl restart postgresql
```

## Mantenimiento

### Actualizar la aplicación

```bash
# Ir al directorio de la aplicación
cd /var/www/gestor-proyectos

# Obtener los últimos cambios
git pull

# Instalar dependencias (si hay nuevas)
npm install --production

# Reconstruir la aplicación
npm run build

# Reiniciar la aplicación
pm2 restart gestor-proyectos
```

### Hacer copias de seguridad de la base de datos

```bash
# Crear copia de seguridad
sudo -u postgres pg_dump gestor_proyectos > backup_$(date +%Y%m%d).sql

# Restaurar copia de seguridad
sudo -u postgres psql gestor_proyectos < backup_YYYYMMDD.sql
``` 