const getLocalStorage = (key: string): any => {
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error al leer del storage:', error);
      return null;
    }
  }
  return null;
};

const setLocalStorage = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error al guardar en storage:', error);
    }
  }
};

const removeLocalStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar del storage:', error);
    }
  }
};

const clearLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar el storage:', error);
    }
  }
};

export {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage
}; 