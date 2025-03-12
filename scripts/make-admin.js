// Este script modifica directamente el localStorage para asegurarse de que
// el usuario ivan.zarate@minseg.gob.ar tenga el rol de Administrador

// Función para ejecutar en la consola del navegador
function makeUserAdmin() {
  try {
    // Obtener el estado actual del almacenamiento
    const storageData = localStorage.getItem('user-storage');
    
    if (!storageData) {
      console.error('No se encontró información de usuarios en localStorage');
      return;
    }
    
    // Parsear los datos
    const data = JSON.parse(storageData);
    
    if (!data.state || !Array.isArray(data.state.users)) {
      console.error('Formato de datos inválido en localStorage');
      return;
    }
    
    // Buscar al usuario por email
    const userIndex = data.state.users.findIndex(
      user => user.email === 'ivan.zarate@minseg.gob.ar'
    );
    
    if (userIndex === -1) {
      console.error('Usuario no encontrado: ivan.zarate@minseg.gob.ar');
      return;
    }
    
    // Verificar si ya es administrador
    if (data.state.users[userIndex].role === 'Administrador') {
      console.log('El usuario ivan.zarate@minseg.gob.ar ya tiene el rol de Administrador.');
      return;
    }
    
    // Actualizar el rol a Administrador
    data.state.users[userIndex].role = 'Administrador';
    
    // Si el usuario está actualmente logueado, actualizar también currentUser
    if (data.state.currentUser && data.state.currentUser.email === 'ivan.zarate@minseg.gob.ar') {
      data.state.currentUser.role = 'Administrador';
    }
    
    // Guardar los cambios en localStorage
    localStorage.setItem('user-storage', JSON.stringify(data));
    
    console.log('¡El usuario ivan.zarate@minseg.gob.ar ahora tiene el rol de Administrador!');
    console.log('Por favor, recarga la página para que los cambios surtan efecto.');
  } catch (err) {
    console.error('Error al actualizar el rol del usuario:', err);
  }
}

// Instrucciones para usar este script
console.log(`
INSTRUCCIONES:
1. Abre la consola del navegador (F12 o Ctrl+Shift+I)
2. Copia y pega todo el contenido de esta función
3. Ejecuta: makeUserAdmin()
4. Recarga la página para que los cambios surtan efecto
`);

// Si estamos en un entorno Node.js, exportamos la función
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeUserAdmin };
} 