// Este script debe ejecutarse en el navegador
// Puedes copiarlo y pegarlo en la consola del navegador mientras estás en tu aplicación

(function() {
  try {
    // Obtener el contenido del localStorage
    const userStorage = localStorage.getItem('user-storage');
    
    if (!userStorage) {
      console.error('No se encontró "user-storage" en localStorage');
      return;
    }
    
    // Crear un objeto Blob con el contenido
    const blob = new Blob([userStorage], { type: 'application/json' });
    
    // Crear un enlace para descargar el archivo
    const a = document.createElement('a');
    a.download = '.local-storage-backup.json';
    a.href = URL.createObjectURL(blob);
    a.style.display = 'none';
    
    // Agregar el enlace al documento y hacer clic en él
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
    
    console.log('Copia de seguridad de localStorage creada exitosamente');
  } catch (error) {
    console.error('Error al crear copia de seguridad:', error);
  }
})(); 