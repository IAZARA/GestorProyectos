# Sistema de Notificaciones en Tiempo Real

Este documento describe el sistema de notificaciones en tiempo real implementado en la aplicación de gestión de proyectos.

## Arquitectura

El sistema de notificaciones está compuesto por los siguientes componentes:

1. **Servidor WebSocket**: Un servidor independiente que maneja las conexiones en tiempo real con los clientes.
2. **Cliente WebSocket**: Implementado en el navegador para recibir notificaciones en tiempo real.
3. **Base de datos**: Almacena las notificaciones para su persistencia.
4. **API REST**: Permite la gestión de notificaciones a través de endpoints HTTP.

## Flujo de Notificaciones

1. Un usuario realiza una acción que genera una notificación (ej. crear un proyecto, asignar una tarea).
2. La aplicación crea la notificación en la base de datos.
3. La aplicación envía la notificación al servidor WebSocket.
4. El servidor WebSocket envía la notificación a los usuarios destinatarios conectados.
5. Si un usuario no está conectado, recibirá las notificaciones pendientes al conectarse.

## Tipos de Notificaciones

El sistema soporta los siguientes tipos de notificaciones:

- `task_assigned`: Cuando se asigna una tarea a un usuario.
- `comment_added`: Cuando se añade un comentario a un proyecto.
- `project_updated`: Cuando se actualiza un proyecto.
- `wiki_edited`: Cuando se edita la wiki de un proyecto.
- `project_added`: Cuando se añade un nuevo proyecto.
- `event_added`: Cuando se añade un evento al calendario.
- `document_uploaded`: Cuando se sube un nuevo documento.
- `test`: Para pruebas del sistema.

## Formato de Notificaciones

Las notificaciones tienen el siguiente formato:

```javascript
{
  id: string,            // ID único de la notificación
  type: string,          // Tipo de notificación
  content: string,       // Contenido de la notificación
  fromId: string,        // ID del usuario que envía la notificación
  toId: string,          // ID del usuario destinatario
  isRead: boolean,       // Indica si la notificación ha sido leída
  createdAt: Date,       // Fecha de creación
  from: {                // Información del remitente
    id: string,
    firstName: string,
    lastName: string,
    photoUrl?: string
  }
}
```

## Uso del Sistema

### Enviar una Notificación

Para enviar una notificación desde el código:

```javascript
import { sendNotification } from '../lib/socket';

// Enviar notificación
sendNotification({
  type: 'task_assigned',
  content: 'Se te ha asignado una nueva tarea: "Completar informe"',
  fromUserId: currentUser.id,
  toUserId: assignedUserId
});
```

### Recibir Notificaciones

El componente `NotificationCenter` se encarga de recibir y mostrar las notificaciones:

```jsx
import { NotificationCenter } from '../components/NotificationCenter';

function Layout() {
  return (
    <div>
      <header>
        <NotificationCenter />
      </header>
      {/* Resto del layout */}
    </div>
  );
}
```

### Marcar Notificaciones como Leídas

Para marcar una notificación como leída:

```javascript
import { markNotificationAsRead } from '../lib/socket';

// Marcar como leída
markNotificationAsRead(notificationId);
```

## Herramientas de Prueba

El sistema incluye varias herramientas para probar las notificaciones:

### Prueba desde Node.js

```bash
npm run test:notification
```

Este comando ejecuta un script que envía notificaciones de prueba desde Node.js.

### Prueba desde el Navegador

```bash
npm run test:notification:browser
```

Este comando inicia un servidor web que sirve una página HTML para probar las notificaciones desde el navegador. La página está disponible en http://localhost:8080.

### Iniciar Todo el Sistema

```bash
npm run start:all
```

Este comando inicia todos los componentes del sistema, incluyendo:
- Servidor WebSocket
- Aplicación Next.js
- Página de prueba de notificaciones

## Solución de Problemas

### Notificaciones no Recibidas

1. Verificar que el servidor WebSocket esté en ejecución.
2. Verificar que el usuario esté conectado al servidor WebSocket.
3. Verificar que los IDs de usuario sean correctos.
4. Verificar que el formato de la notificación sea correcto.

### Errores en el Servidor WebSocket

Los errores del servidor WebSocket se registran en la consola. Buscar mensajes como:

```
[SOCKET-SERVER] Error al crear notificación: ...
```

### Compatibilidad de Campos

El sistema soporta dos formatos de campos para compatibilidad:

- Formato antiguo: `fromId` y `toId`
- Formato nuevo: `fromUserId` y `toUserId`

El sistema convertirá automáticamente entre estos formatos según sea necesario.

## Mejoras Futuras

- Implementar notificaciones push para dispositivos móviles.
- Añadir soporte para notificaciones grupales.
- Implementar filtros de notificaciones por tipo.
- Añadir soporte para notificaciones con acciones interactivas.
- Mejorar la interfaz de usuario para la gestión de notificaciones. 