# Migración de localStorage a PostgreSQL

Este documento describe cómo migrar el código que utiliza localStorage directamente a la nueva utilidad de almacenamiento que sincroniza con PostgreSQL.

## Cambios necesarios

### 1. Importar la nueva utilidad de almacenamiento

Reemplazar:
```typescript
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../lib/localStorage';
```

Por:
```typescript
import { getStorage, setStorage, removeStorage } from '../lib/storage';
```

### 2. Actualizar las llamadas a funciones

#### Obtener datos

Reemplazar:
```typescript
const data = getLocalStorage('key');
```

Por:
```typescript
const data = await getStorage('key', userId);
```

#### Guardar datos

Reemplazar:
```typescript
setLocalStorage('key', value);
```

Por:
```typescript
await setStorage('key', value);
```

#### Eliminar datos

Reemplazar:
```typescript
removeLocalStorage('key');
```

Por:
```typescript
await removeStorage('key', id);
```

### 3. Actualizar los stores

Los stores deben ser actualizados para utilizar la nueva utilidad de almacenamiento. Por ejemplo:

```typescript
// Antes
const loadFromLocalStorage = (): { users: User[], currentUser: User | null } | null => {
  try {
    if (typeof window === 'undefined') {
      console.log('Ejecutando en el servidor, no se puede acceder a localStorage');
      return null;
    }
    
    const savedState = getLocalStorage('user-storage');
    if (savedState) {
      console.log('Estado cargado desde localStorage:', savedState.users.length, 'usuarios');
      return savedState;
    }
    
    return null;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
  }
};

// Después
const loadFromStorage = async (): Promise<{ users: User[], currentUser: User | null } | null> => {
  try {
    const savedState = await getStorage<{ users: User[], currentUser: User | null }>('users');
    if (savedState) {
      console.log('Estado cargado desde almacenamiento:', savedState.users.length, 'usuarios');
      return savedState;
    }
    
    return null;
  } catch (error) {
    console.error('Error al cargar desde almacenamiento:', error);
    return null;
  }
};
```

## Beneficios

1. **Sincronización automática**: Los datos se sincronizan automáticamente con PostgreSQL.
2. **Caché local**: Se mantiene una copia en localStorage para acceso rápido.
3. **Consistencia**: Los datos son consistentes entre diferentes dispositivos y sesiones.
4. **Robustez**: Los datos persisten incluso si se limpia el localStorage.

## Consideraciones

1. **Asincronía**: Las funciones de almacenamiento ahora son asíncronas, por lo que deben ser llamadas con `await`.
2. **Errores**: Las funciones manejan errores internamente, pero es recomendable manejar errores adicionales en el código que las llama.
3. **Expiración**: Los datos en localStorage expiran después de 1 minuto para garantizar que se obtengan datos actualizados de la API.
