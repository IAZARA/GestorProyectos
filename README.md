# Gestionadcor de Proyectos

Sistema de gestión de proyectos con calendario, notificaciones y colaboración en tiempo real.

## Características

- Gestión de proyectos y tareas
- Calendario compartido
- Sistema de notificaciones en tiempo real
- Colaboración entre usuarios
- Almacenamiento persistente en PostgreSQL

## Requisitos previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## Configuración

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd gestionadcor-de-proyectos
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```
   # Configuración de la base de datos PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gestionadcor
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña

   # Configuración del servidor
   PORT=3000
   NODE_ENV=development

   # Configuración de JWT para autenticación
   JWT_SECRET=tu_secreto_jwt
   JWT_EXPIRES_IN=7d

   # Configuración de NextAuth
   NEXTAUTH_SECRET=tu_secreto_para_nextauth
   NEXTAUTH_URL=http://localhost:3000

   # Configuración de carga de archivos
   UPLOAD_DIR=./uploads
   ```

4. Inicializa la base de datos:
   ```bash
   npm run migrate
   ```

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```bash
npm run start:postgres
```

O también:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura del proyecto

```
gestionadcor-de-proyectos/
├── app/                  # Componentes y páginas de la aplicación
├── components/           # Componentes reutilizables
├── config/               # Configuración de la aplicación
├── lib/                  # Utilidades y servicios
├── migrations/           # Migraciones de la base de datos
├── pages/                # Páginas de la aplicación (Next.js)
│   └── api/              # Endpoints de la API
├── public/               # Archivos estáticos
├── scripts/              # Scripts de utilidad
├── store/                # Stores de estado (Zustand)
├── types/                # Definiciones de tipos TypeScript
└── uploads/              # Directorio para archivos subidos
```

## Scripts disponibles

- `npm run dev`: Inicia la aplicación en modo desarrollo
- `npm run build`: Compila la aplicación para producción
- `npm run start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter
- `npm run migrate`: Ejecuta las migraciones de la base de datos
- `npm run start:postgres`: Inicia la aplicación verificando la conexión a PostgreSQL
- `npm run check:structure`: Verifica la estructura del proyecto
- `npm run clean:mongodb`: Elimina las referencias a MongoDB

### Scripts de prueba y verificación

- `scripts/test-postgres-api.js`: Prueba todos los endpoints de la API de PostgreSQL
- `scripts/run-tests.sh`: Inicia el servidor y ejecuta las pruebas de la API
- `scripts/verify-migration.js`: Verifica la integridad de los datos migrados de MongoDB a PostgreSQL

Para ejecutar las pruebas:

```bash
# Ejecutar todas las pruebas
./scripts/run-tests.sh

# Ejecutar solo las pruebas de la API
node scripts/test-postgres-api.js

# Verificar la migración
node scripts/verify-migration.js
```

## Migración de MongoDB a PostgreSQL

Este proyecto ha sido migrado de MongoDB a PostgreSQL. Para más detalles sobre la migración, consulta el archivo [MIGRATION_README.md](MIGRATION_README.md).

## Migración de localStorage a PostgreSQL

Para migrar el código que utiliza localStorage directamente a la nueva utilidad de almacenamiento que sincroniza con PostgreSQL, consulta el archivo [LOCALSTORAGE_MIGRATION.md](LOCALSTORAGE_MIGRATION.md).

## Usuarios por defecto

El sistema incluye dos usuarios por defecto:

1. **Iván Zarate**
   - ID: `857af152-2fd5-4a4b-a8cb-468fc2681f5c`
   - Email: `ivan@example.com`
   - Rol: `admin`

2. **Maxi Scarimbolo**
   - ID: `e3fc93f9-9941-4840-ac2c-a30a7fcd322f`
   - Email: `maxi@example.com`
   - Rol: `user`

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 