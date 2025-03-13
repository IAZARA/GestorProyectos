// Este script debe ejecutarse en la consola del navegador
// para limpiar el localStorage y forzar una recarga completa de los datos

// Limpiar el localStorage
localStorage.removeItem('user-storage');
console.log('localStorage limpiado');

// Recargar la página
window.location.reload(); 