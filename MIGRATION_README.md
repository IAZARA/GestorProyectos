# Migración a PostgreSQL

Este documento describe el proceso de migración de MongoDB a PostgreSQL para el sistema de gestión de proyectos.

## Estructura de archivos creados

1. **Configuración**
   - `config/database.js` - Configuración de conexión a PostgreSQL
   - `.env` - Variables de entorno (actualizado con credenciales de PostgreSQL)

2. **Migraciones**
   - `migrations/20240313_create_tables.js` - Migración para crear las tablas principales

3. **Scripts**
   - `scripts/init-postgres.js` - Inicializa la base de datos PostgreSQL
   - `scripts/run-migrations.js` - Ejecuta las migraciones
   - `scripts/migrate-mongo-to-postgres.js` - Migra datos de MongoDB a PostgreSQL
   - `scripts/migrate-to-postgres.sh` - Script principal que ejecuta todo el proceso

4. **API Endpoints**
   - `pages/api/notifications/index.js` - Obtener y crear notificaciones
   - `pages/api/notifications/[id].js` - Obtener, actualizar y eliminar notificaciones por ID
   - `pages/api/notifications/[id]/read.js` - Marcar una notificación como leída
   - `pages/api/notifications/read-all.js` - Marcar todas las notificaciones de un usuario como leídas

5. **Servicios**
   - `lib/db.js` - Servicio de base de datos para la aplicación

6. **Stores**
   - `store/notificationStore.ts` - Store de notificaciones actualizado para usar PostgreSQL

## Pasos para ejecutar la migración

1. **Asegúrate de tener PostgreSQL instalado y en ejecución**

2. **Actualiza las credenciales en el archivo `.env`**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gestionadcor
   DB_USER=postgres
   DB_PASSWORD=Vortex733-
   ```

3. **Ejecuta el script de migración**
   ```bash
   ./scripts/migrate-to-postgres.sh
   ```

4. **Verifica la migración**
   - El script mostrará un recuento de registros en cada tabla
   - Puedes conectarte directamente a PostgreSQL para verificar los datos:
     ```bash
     psql -U postgres -d gestionadcor
     ```

## Estructura de la base de datos

La base de datos PostgreSQL tiene las siguientes tablas:

1. **users** - Usuarios del sistema
   - `id` (UUID, PK)
   - `first_name` (VARCHAR)
   - `last_name` (VARCHAR)
   - `email` (VARCHAR, UNIQUE)
   - `role` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **projects** - Proyectos
   - `id` (UUID, PK)
   - `name` (VARCHAR)
   - `description` (TEXT)
   - `created_by` (UUID, FK -> users.id)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. **project_members** - Miembros de proyectos
   - `project_id` (UUID, FK -> projects.id)
   - `user_id` (UUID, FK -> users.id)
   - PK: (project_id, user_id)

4. **events** - Eventos del calendario
   - `id` (UUID, PK)
   - `title` (VARCHAR)
   - `description` (TEXT)
   - `start_date` (TIMESTAMP)
   - `end_date` (TIMESTAMP)
   - `created_by` (UUID, FK -> users.id)
   - `project_id` (UUID, FK -> projects.id)
   - `type` (VARCHAR)
   - `color` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

5. **event_attendees** - Asistentes a eventos
   - `event_id` (UUID, FK -> events.id)
   - `user_id` (UUID, FK -> users.id)
   - PK: (event_id, user_id)

6. **event_attachments** - Adjuntos de eventos
   - `id` (UUID, PK)
   - `event_id` (UUID, FK -> events.id)
   - `name` (VARCHAR)
   - `file_path` (VARCHAR)
   - `file_type` (VARCHAR)
   - `file_size` (INTEGER)
   - `uploaded_at` (TIMESTAMP)

7. **notifications** - Notificaciones
   - `id` (UUID, PK)
   - `type` (VARCHAR)
   - `content` (TEXT)
   - `from_id` (UUID, FK -> users.id)
   - `to_id` (UUID, FK -> users.id)
   - `read` (BOOLEAN)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## Cambios en el código

1. **Stores**
   - Los stores ahora se comunican con la API en lugar de almacenar datos directamente en localStorage
   - Se mantiene una copia en localStorage para acceso rápido y funcionamiento offline

2. **API Endpoints**
   - Nuevos endpoints para interactuar con la base de datos PostgreSQL
   - Soporte para operaciones CRUD en notificaciones

3. **Servicios**
   - Nuevo servicio de base de datos para interactuar con PostgreSQL
   - Funciones para usuarios, proyectos, eventos y notificaciones

## Consideraciones para usuarios futuros

El sistema ahora está preparado para manejar usuarios futuros de manera más robusta:

1. **IDs consistentes**
   - Se utilizan UUIDs para todos los IDs
   - No hay dependencia de IDs específicos para el funcionamiento del sistema

2. **Integridad referencial**
   - PostgreSQL garantiza la integridad referencial con claves foráneas
   - No se pueden crear notificaciones para usuarios que no existen

3. **Escalabilidad**
   - PostgreSQL es más adecuado para datos relacionales y consultas complejas
   - Mejor soporte para transacciones y consistencia de datos

## Próximos pasos

1. **Actualizar otros stores**
   - Migrar los stores de proyectos, eventos y usuarios para usar PostgreSQL

2. **Implementar autenticación robusta**
   - Integrar con el sistema de autenticación existente

3. **Pruebas exhaustivas**
   - Probar todas las funcionalidades con la nueva base de datos

4. **Monitoreo**
   - Implementar logging y monitoreo para detectar problemas 