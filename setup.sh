#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Iniciando configuración del Gestor de Proyectos del Ministerio de Seguridad ===${NC}"
echo -e "${YELLOW}Este script configurará todo lo necesario para ejecutar la aplicación${NC}"

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor, ejecuta este script como root o con sudo${NC}"
  exit 1
fi

# Obtener el directorio actual
CURRENT_DIR=$(pwd)
echo -e "${GREEN}Directorio de instalación: $CURRENT_DIR${NC}"

# Actualizar el sistema
echo -e "${YELLOW}Actualizando el sistema...${NC}"
apt-get update
apt-get upgrade -y

# Instalar dependencias básicas
echo -e "${YELLOW}Instalando dependencias básicas...${NC}"
apt-get install -y curl wget git build-essential

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}Node.js $(node -v) instalado correctamente${NC}"
else
    echo -e "${GREEN}Node.js $(node -v) ya está instalado${NC}"
fi

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker...${NC}"
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker instalado correctamente${NC}"
else
    echo -e "${GREEN}Docker ya está instalado${NC}"
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Instalando Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose instalado correctamente${NC}"
else
    echo -e "${GREEN}Docker Compose ya está instalado${NC}"
fi

# Instalar PM2 globalmente
echo -e "${YELLOW}Instalando PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}PM2 instalado correctamente${NC}"

# Crear archivo .env si no existe
echo -e "${YELLOW}Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    # Preguntar por la URL del servidor
    echo -e "${YELLOW}Ingresa la URL del servidor (por defecto: http://localhost:3000):${NC}"
    read -r server_url
    server_url=${server_url:-http://localhost:3000}
    
    # Preguntar por la contraseña de la base de datos
    echo -e "${YELLOW}Ingresa la contraseña para la base de datos PostgreSQL (por defecto: postgres):${NC}"
    read -r db_password
    db_password=${db_password:-postgres}
    
    # Generar un secreto aleatorio para NextAuth
    nextauth_secret=$(openssl rand -base64 32)
    
    cat > .env << EOL
# Base de datos
DATABASE_URL=postgresql://postgres:${db_password}@localhost:5432/gestionadcor
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${db_password}
POSTGRES_DB=gestionadcor

# NextAuth
NEXTAUTH_URL=${server_url}
NEXTAUTH_SECRET=${nextauth_secret}

# Otros
NODE_ENV=production
EOL
    echo -e "${GREEN}Archivo .env creado correctamente${NC}"
else
    echo -e "${GREEN}El archivo .env ya existe${NC}"
fi

# Crear docker-compose.yml si no existe
echo -e "${YELLOW}Configurando Docker Compose...${NC}"
if [ ! -f docker-compose.yml ]; then
    cat > docker-compose.yml << EOL
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: gestionadcor-postgres
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
EOL
    echo -e "${GREEN}Archivo docker-compose.yml creado correctamente${NC}"
else
    echo -e "${GREEN}El archivo docker-compose.yml ya existe${NC}"
fi

# Instalar dependencias del proyecto
echo -e "${YELLOW}Instalando dependencias del proyecto...${NC}"
npm install
echo -e "${GREEN}Dependencias instaladas correctamente${NC}"

# Iniciar la base de datos
echo -e "${YELLOW}Iniciando la base de datos PostgreSQL...${NC}"
docker-compose up -d
echo -e "${GREEN}Base de datos iniciada correctamente${NC}"

# Esperar a que la base de datos esté lista
echo -e "${YELLOW}Esperando a que la base de datos esté lista...${NC}"
sleep 10

# Generar cliente de Prisma
echo -e "${YELLOW}Generando cliente de Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}Cliente de Prisma generado correctamente${NC}"

# Ejecutar migraciones de Prisma
echo -e "${YELLOW}Ejecutando migraciones de Prisma...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}Migraciones ejecutadas correctamente${NC}"

# Crear archivo de seed para inicializar la base de datos con el usuario administrador
echo -e "${YELLOW}Creando archivo de seed para inicializar la base de datos...${NC}"
mkdir -p prisma
cat > prisma/seed.ts << EOL
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpiar la base de datos
  console.log('Limpiando la base de datos...');
  await prisma.notification.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuario administrador
  console.log('Creando usuario administrador...');
  const adminUser = await prisma.user.create({
    data: {
      id: '857af152-2fd5-4a4b-a8cb-468fc2681f5c',
      firstName: 'Ivan',
      lastName: 'Zarate',
      email: 'ivan.zarate@minseg.gob.ar',
      password: await bcrypt.hash('Vortex733-', 10),
      expertise: 'Administrativo',
      role: 'Administrador',
      photoUrl: ''
    }
  });

  console.log('Base de datos inicializada con el usuario administrador:', adminUser.email);
  console.log('ID del usuario administrador:', adminUser.id);
}

main()
  .catch((e) => {
    console.error('Error durante la inicialización de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Desconectando de la base de datos...');
    await prisma.\$disconnect();
  });
EOL

# Asegurarse de que el package.json tenga la configuración correcta para Prisma
echo -e "${YELLOW}Configurando package.json para Prisma...${NC}"
# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Instalando jq...${NC}"
    apt-get install -y jq
fi

# Añadir la configuración de Prisma al package.json
if [ -f package.json ]; then
    # Crear un archivo temporal
    jq '.prisma = {"seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"}' package.json > package.json.tmp
    mv package.json.tmp package.json
    
    # Asegurarse de que los scripts necesarios estén presentes
    jq '.scripts["prisma:generate"] = "prisma generate" | .scripts["prisma:migrate"] = "prisma migrate deploy" | .scripts["prisma:seed"] = "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"' package.json > package.json.tmp
    mv package.json.tmp package.json
    
    echo -e "${GREEN}package.json configurado correctamente${NC}"
else
    echo -e "${RED}No se encontró el archivo package.json${NC}"
    exit 1
fi

# Ejecutar seed
echo -e "${YELLOW}Inicializando la base de datos con el usuario administrador...${NC}"
npx prisma db seed
echo -e "${GREEN}Base de datos inicializada correctamente${NC}"

# Construir la aplicación
echo -e "${YELLOW}Construyendo la aplicación...${NC}"
npm run build
echo -e "${GREEN}Aplicación construida correctamente${NC}"

# Crear script de inicio
echo -e "${YELLOW}Creando script de inicio...${NC}"
cat > start.sh << EOL
#!/bin/bash
# Script de inicio para el Gestor de Proyectos del Ministerio de Seguridad

echo "Iniciando la base de datos PostgreSQL..."
docker-compose up -d

echo "Esperando a que la base de datos esté lista..."
sleep 5

echo "Iniciando la aplicación..."
npm run start
EOL
chmod +x start.sh
echo -e "${GREEN}Script de inicio creado correctamente${NC}"

# Configurar PM2 para iniciar la aplicación
echo -e "${YELLOW}Configurando PM2 para iniciar la aplicación...${NC}"
pm2 start server.js --name gestionadcor
pm2 save
pm2 startup
echo -e "${GREEN}PM2 configurado correctamente${NC}"

# Configurar Nginx como proxy inverso
echo -e "${YELLOW}¿Deseas configurar Nginx como proxy inverso? (s/n)${NC}"
read -r configure_nginx

if [ "$configure_nginx" = "s" ] || [ "$configure_nginx" = "S" ]; then
    echo -e "${YELLOW}Instalando Nginx...${NC}"
    apt-get install -y nginx

    echo -e "${YELLOW}¿Tienes un nombre de dominio para el servidor? (s/n)${NC}"
    read -r has_domain
    
    if [ "$has_domain" = "s" ] || [ "$has_domain" = "S" ]; then
        echo -e "${YELLOW}Ingresa el nombre de dominio (ej: gestionadcor.minseg.gob.ar):${NC}"
        read -r domain_name
        
        echo -e "${YELLOW}Configurando Nginx para el dominio $domain_name...${NC}"
        cat > /etc/nginx/sites-available/gestionadcor << EOL
server {
    listen 80;
    server_name ${domain_name};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
    else
        echo -e "${YELLOW}Configurando Nginx para acceso por IP...${NC}"
        cat > /etc/nginx/sites-available/gestionadcor << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
    fi

    # Activar la configuración
    ln -sf /etc/nginx/sites-available/gestionadcor /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Verificar la configuración de Nginx
    nginx -t

    # Reiniciar Nginx
    systemctl restart nginx
    systemctl enable nginx

    echo -e "${GREEN}Nginx configurado correctamente${NC}"

    # Configurar SSL con Certbot si hay dominio
    if [ "$has_domain" = "s" ] || [ "$has_domain" = "S" ]; then
        echo -e "${YELLOW}¿Deseas configurar SSL con Certbot para $domain_name? (s/n)${NC}"
        read -r configure_ssl

        if [ "$configure_ssl" = "s" ] || [ "$configure_ssl" = "S" ]; then
            echo -e "${YELLOW}Ingresa un email para las notificaciones de Let's Encrypt:${NC}"
            read -r admin_email

            echo -e "${YELLOW}Instalando Certbot...${NC}"
            apt-get install -y certbot python3-certbot-nginx

            echo -e "${YELLOW}Configurando SSL para $domain_name...${NC}"
            certbot --nginx -d "$domain_name" --non-interactive --agree-tos --email "$admin_email"

            echo -e "${GREEN}SSL configurado correctamente${NC}"
            
            # Configurar renovación automática de certificados
            echo -e "${YELLOW}Configurando renovación automática de certificados...${NC}"
            (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | crontab -
            echo -e "${GREEN}Renovación automática de certificados configurada${NC}"
        fi
    fi
fi

# Crear un archivo de información sobre la instalación
echo -e "${YELLOW}Creando archivo de información sobre la instalación...${NC}"
cat > INSTALACION.txt << EOL
=== Información de Instalación del Gestor de Proyectos ===

Fecha de instalación: $(date)
Versión de Node.js: $(node -v)
Versión de npm: $(npm -v)
Versión de Docker: $(docker --version)
Versión de Docker Compose: $(docker-compose --version)

Acceso a la aplicación:
- Local: http://localhost:3000
EOL

if [ "$configure_nginx" = "s" ] || [ "$configure_nginx" = "S" ]; then
    echo "- Remoto: http://$(curl -s ifconfig.me)" >> INSTALACION.txt
    if [ "$has_domain" = "s" ] || [ "$has_domain" = "S" ]; then
        echo "- Dominio: http://$domain_name" >> INSTALACION.txt
        if [ "$configure_ssl" = "s" ] || [ "$configure_ssl" = "S" ]; then
            echo "- Dominio seguro: https://$domain_name" >> INSTALACION.txt
        fi
    fi
fi

cat >> INSTALACION.txt << EOL

Credenciales de acceso:
- Email: ivan.zarate@minseg.gob.ar
- Contraseña: Vortex733-

Comandos útiles:
- Iniciar la aplicación: ./start.sh
- Gestionar con PM2: pm2 status, pm2 logs gestionadcor, pm2 restart gestionadcor
- Ver logs: pm2 logs gestionadcor
EOL

echo -e "${GREEN}Archivo de información creado: INSTALACION.txt${NC}"

echo -e "${GREEN}¡Configuración completada!${NC}"
echo -e "${GREEN}La aplicación está disponible en: http://localhost:3000${NC}"
if [ "$configure_nginx" = "s" ] || [ "$configure_nginx" = "S" ]; then
    echo -e "${GREEN}También puedes acceder a través de la IP del servidor: http://$(curl -s ifconfig.me)${NC}"
    if [ "$has_domain" = "s" ] || [ "$has_domain" = "S" ]; then
        echo -e "${GREEN}O a través del dominio: http://$domain_name${NC}"
        if [ "$configure_ssl" = "s" ] || [ "$configure_ssl" = "S" ]; then
            echo -e "${GREEN}O de forma segura: https://$domain_name${NC}"
        fi
    fi
fi

echo -e "${YELLOW}Para iniciar manualmente la aplicación, ejecuta:${NC}"
echo -e "${GREEN}./start.sh${NC}"
echo -e "${YELLOW}O para usar PM2:${NC}"
echo -e "${GREEN}pm2 start server.js --name gestionadcor${NC}"

echo -e "${YELLOW}Credenciales de acceso:${NC}"
echo -e "${GREEN}Email: ivan.zarate@minseg.gob.ar${NC}"
echo -e "${GREEN}Contraseña: Vortex733-${NC}" 