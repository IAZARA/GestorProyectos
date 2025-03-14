# Plan de Pruebas del Sistema de Gestión de Proyectos

Este documento proporciona un plan detallado para probar todas las funcionalidades del sistema de gestión de proyectos.

## Requisitos Previos

1. **Servidor en ejecución**: Asegúrate de que el servidor esté en ejecución con `npm run dev`.
2. **Base de datos PostgreSQL**: Verifica que la base de datos PostgreSQL esté configurada y accesible.
3. **Usuarios de prueba**: Utiliza los usuarios predefinidos para las pruebas:
   - Iván (ID: 857af152-2fd5-4a4b-a8cb-468fc2681f5c)
   - Maxi (ID: e3fc93f9-9941-4840-ac2c-a30a7fcd322f)

## 1. Pruebas de Autenticación

### 1.1 Inicio de Sesión

1. Abre el navegador y navega a `http://localhost:3000`.
2. En la página de inicio de sesión, introduce las siguientes credenciales:
   - Email: `ivan@example.com`
   - Contraseña: `password`
3. Haz clic en el botón "Iniciar Sesión".
4. Verifica que se redirige al dashboard y que el nombre de usuario aparece en la esquina superior derecha.

### 1.2 Cierre de Sesión

1. Haz clic en el nombre de usuario en la esquina superior derecha.
2. Selecciona "Cerrar Sesión" en el menú desplegable.
3. Verifica que se redirige a la página de inicio de sesión.

## 2. Pruebas de Gestión de Usuarios

### 2.1 Ver Perfil de Usuario

1. Inicia sesión con las credenciales de Iván.
2. Haz clic en el nombre de usuario en la esquina superior derecha.
3. Selecciona "Perfil" en el menú desplegable.
4. Verifica que se muestra la información del perfil correctamente.

### 2.2 Editar Perfil de Usuario

1. En la página de perfil, haz clic en el botón "Editar Perfil".
2. Modifica algunos campos, como el nombre o la experiencia.
3. Haz clic en "Guardar Cambios".
4. Verifica que los cambios se han guardado correctamente.

## 3. Pruebas de Gestión de Proyectos

### 3.1 Ver Lista de Proyectos

1. Inicia sesión con las credenciales de Iván.
2. Navega a la sección "Proyectos" desde el menú lateral.
3. Verifica que se muestra la lista de proyectos disponibles.

### 3.2 Crear un Nuevo Proyecto

1. En la página de proyectos, haz clic en el botón "Nuevo Proyecto".
2. Completa el formulario con la siguiente información:
   - Nombre: "Proyecto de Prueba"
   - Descripción: "Este es un proyecto de prueba para verificar la funcionalidad"
   - Miembros: Selecciona a Maxi como miembro adicional
3. Haz clic en "Crear Proyecto".
4. Verifica que el proyecto aparece en la lista de proyectos.

### 3.3 Ver Detalles de un Proyecto

1. En la lista de proyectos, haz clic en el proyecto recién creado.
2. Verifica que se muestra la información detallada del proyecto, incluyendo la descripción y los miembros.

### 3.4 Editar un Proyecto

1. En la página de detalles del proyecto, haz clic en el botón "Editar Proyecto".
2. Modifica la descripción del proyecto.
3. Haz clic en "Guardar Cambios".
4. Verifica que los cambios se han guardado correctamente.

### 3.5 Eliminar un Proyecto

1. En la página de detalles del proyecto, haz clic en el botón "Eliminar Proyecto".
2. Confirma la eliminación en el diálogo de confirmación.
3. Verifica que el proyecto ya no aparece en la lista de proyectos.

## 4. Pruebas de Gestión de Eventos

### 4.1 Ver Calendario de Eventos

1. Inicia sesión con las credenciales de Iván.
2. Navega a la sección "Calendario" desde el menú lateral.
3. Verifica que se muestra el calendario con los eventos existentes.

### 4.2 Crear un Nuevo Evento

1. En la página del calendario, haz clic en una fecha o en el botón "Nuevo Evento".
2. Completa el formulario con la siguiente información:
   - Título: "Reunión de Prueba"
   - Descripción: "Esta es una reunión de prueba para verificar la funcionalidad"
   - Fecha de inicio: Selecciona una fecha y hora
   - Fecha de fin: Selecciona una fecha y hora posterior
   - Tipo: "Reunión"
   - Color: Selecciona un color
   - Asistentes: Selecciona a Maxi como asistente adicional
3. Haz clic en "Crear Evento".
4. Verifica que el evento aparece en el calendario.

### 4.3 Ver Detalles de un Evento

1. En el calendario, haz clic en el evento recién creado.
2. Verifica que se muestra la información detallada del evento, incluyendo la descripción y los asistentes.

### 4.4 Editar un Evento

1. En la página de detalles del evento, haz clic en el botón "Editar Evento".
2. Modifica la descripción del evento.
3. Haz clic en "Guardar Cambios".
4. Verifica que los cambios se han guardado correctamente.

### 4.5 Eliminar un Evento

1. En la página de detalles del evento, haz clic en el botón "Eliminar Evento".
2. Confirma la eliminación en el diálogo de confirmación.
3. Verifica que el evento ya no aparece en el calendario.

## 5. Pruebas de Notificaciones

### 5.1 Ver Notificaciones

1. Inicia sesión con las credenciales de Maxi.
2. Verifica que el icono de notificaciones en la barra superior muestra el número correcto de notificaciones no leídas.
3. Haz clic en el icono de notificaciones.
4. Verifica que se muestra la lista de notificaciones.

### 5.2 Marcar Notificaciones como Leídas

1. En la lista de notificaciones, haz clic en una notificación no leída.
2. Verifica que la notificación se marca como leída y que el contador de notificaciones no leídas se actualiza.

### 5.3 Eliminar Notificaciones

1. En la lista de notificaciones, haz clic en el botón de eliminar junto a una notificación.
2. Verifica que la notificación se elimina de la lista.

## 6. Pruebas de Integración

### 6.1 Flujo de Trabajo Completo

1. Inicia sesión como Iván.
2. Crea un nuevo proyecto.
3. Añade a Maxi como miembro del proyecto.
4. Crea un nuevo evento asociado al proyecto.
5. Añade a Maxi como asistente al evento.
6. Cierra sesión.
7. Inicia sesión como Maxi.
8. Verifica que puedes ver el proyecto y el evento.
9. Verifica que has recibido notificaciones sobre el proyecto y el evento.

## 7. Pruebas de Rendimiento

### 7.1 Carga de Páginas

1. Mide el tiempo de carga de las siguientes páginas:
   - Dashboard
   - Lista de proyectos
   - Calendario de eventos
   - Lista de notificaciones
2. Verifica que los tiempos de carga son aceptables (menos de 3 segundos).

### 7.2 Operaciones CRUD

1. Mide el tiempo de respuesta de las siguientes operaciones:
   - Crear un proyecto
   - Editar un proyecto
   - Eliminar un proyecto
   - Crear un evento
   - Editar un evento
   - Eliminar un evento
2. Verifica que los tiempos de respuesta son aceptables (menos de 2 segundos).

## 8. Pruebas de Compatibilidad

### 8.1 Navegadores

Verifica que el sistema funciona correctamente en los siguientes navegadores:
- Google Chrome
- Mozilla Firefox
- Safari
- Microsoft Edge

### 8.2 Dispositivos

Verifica que el sistema funciona correctamente en los siguientes dispositivos:
- Ordenador de escritorio
- Portátil
- Tablet
- Smartphone

## 9. Pruebas de Seguridad

### 9.1 Autenticación

1. Intenta acceder a páginas protegidas sin iniciar sesión.
2. Verifica que se redirige a la página de inicio de sesión.

### 9.2 Autorización

1. Inicia sesión como un usuario con rol "Usuario".
2. Intenta acceder a funcionalidades reservadas para administradores.
3. Verifica que se muestra un mensaje de error o que las opciones no están disponibles.

## 10. Pruebas de Recuperación

### 10.1 Recuperación de Contraseña

1. En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?".
2. Introduce el email de un usuario existente.
3. Verifica que se envía un correo electrónico con instrucciones para restablecer la contraseña.
4. Sigue las instrucciones y restablece la contraseña.
5. Inicia sesión con la nueva contraseña.

## Conclusión

Este plan de pruebas cubre todas las funcionalidades principales del sistema de gestión de proyectos. Al seguir estos pasos, podrás verificar que el sistema funciona correctamente y cumple con los requisitos establecidos.

Si encuentras algún problema durante las pruebas, documéntalo con la siguiente información:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado
- Comportamiento actual
- Capturas de pantalla (si es posible)

Esto ayudará a los desarrolladores a identificar y solucionar los problemas rápidamente.