# Solución para el Gestor de Proyectos

Este repositorio contiene la solución para los problemas identificados en el Gestor de Proyectos, incluyendo la inconsistencia en la base de datos, la discrepancia entre navegadores y los problemas con las notificaciones.

## Estructura de la Solución

La solución consta de los siguientes componentes:

1. **Servicio de Base de Datos**: Un servicio centralizado para acceder a la base de datos PostgreSQL.
2. **API RESTful**: Endpoints para gestionar usuarios, proyectos y autenticación.
3. **Servicio de Notificaciones**: Un sistema de notificaciones en tiempo real utilizando WebSockets.
4. **Stores Mejorados**: Stores de Zustand que obtienen datos directamente de la base de datos.

## Requisitos

- Node.js 16.x o superior
- PostgreSQL 13.x o superior
- npm o yarn

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd gestor-proyectos
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones.

4. Ejecuta las migraciones de la base de datos:
   ```bash
   npx prisma migrate dev
   ```

5. Inicia los servidores:
   ```bash
   # Inicia el servidor API
   npm run api
   
   # Inicia el servidor WebSocket
   npm run websocket
   
   # Inicia el servidor de desarrollo de Next.js
   npm run dev
   ```

## Componentes Principales

### 1. Servicio de Base de Datos (`db-access-service.js`)

Este servicio proporciona una interfaz unificada para interactuar con la base de datos PostgreSQL. Incluye métodos para:

- Gestionar usuarios (crear, actualizar, eliminar, buscar)
- Gestionar proyectos y tareas
- Gestionar notificaciones

### 2. API RESTful

La API proporciona endpoints para:

- **Autenticación** (`api-auth.js`): Login, verificación de token, restablecimiento de contraseña.
- **Usuarios** (`api-users.js`): CRUD de usuarios.
- **Proyectos** (pendiente de implementar): CRUD de proyectos y tareas.

### 3. Servicio de Notificaciones (`notification-service.js`)

Este servicio gestiona las notificaciones en tiempo real utilizando WebSockets. Características:

- Autenticación de conexiones mediante JWT
- Almacenamiento de notificaciones en la base de datos
- Notificaciones en tiempo real a usuarios conectados
- Limpieza automática de notificaciones antiguas

### 4. Stores Mejorados

Los stores de Zustand han sido mejorados para:

- Obtener datos directamente de la base de datos a través de la API
- Eliminar la dependencia de localStorage para datos persistentes
- Implementar un sistema de versiones para detectar cambios en la estructura de datos
- Proporcionar métodos para limpiar el localStorage

## Uso

### Autenticación

```javascript
// Iniciar sesión
const user = await axios.post('/api/auth/login', { email, password });

// Verificar token
const user = await axios.get('/api/auth/verify', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Usuarios

```javascript
// Obtener todos los usuarios
const users = await axios.get('/api/users');

// Obtener un usuario por ID
const user = await axios.get(`/api/users/${userId}`);

// Crear un usuario
const newUser = await axios.post('/api/users', userData);

// Actualizar un usuario
const updatedUser = await axios.put(`/api/users/${userId}`, userData);

// Eliminar un usuario
await axios.delete(`/api/users/${userId}`);
```

### Notificaciones

```javascript
// Conectar al servidor de WebSockets
const socket = io('http://localhost:3001', {
  auth: { token }
});

// Escuchar notificaciones
socket.on('notifications', (notifications) => {
  console.log('Notificaciones recibidas:', notifications);
});

// Escuchar nuevas notificaciones
socket.on('new-notification', (notification) => {
  console.log('Nueva notificación:', notification);
});

// Marcar una notificación como leída
socket.emit('mark-notification-read', notificationId);

// Solicitar notificaciones
socket.emit('get-notifications');
```

## Migración desde la Versión Anterior

Para migrar desde la versión anterior:

1. Ejecuta el script de limpieza de localStorage:
   ```bash
   npm run clean-storage
   ```

2. Actualiza los stores:
   ```bash
   npm run update-stores
   ```

3. Reinicia la aplicación:
   ```bash
   npm run restart
   ```

## Solución de Problemas

### Problema: Los usuarios no aparecen en la aplicación

**Solución**: Limpia el localStorage visitando `/clear-storage.html` o ejecutando:
```javascript
localStorage.clear();
```

### Problema: Las notificaciones no se reciben

**Solución**: Verifica que el servidor WebSocket esté en ejecución y que el token JWT sea válido.

### Problema: Error al conectar a la base de datos

**Solución**: Verifica las credenciales de la base de datos en el archivo `.env`.

## Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Haz commit de tus cambios (`git commit -am 'Añadir nueva característica'`)
4. Haz push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 