export default function LoginPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2rem', 
        backgroundColor: 'white', 
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Iniciar sesión
        </h1>
        
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Correo electrónico
            </label>
            <input 
              type="email" 
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem' 
              }} 
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Contraseña
            </label>
            <input 
              type="password" 
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem' 
              }} 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              padding: '0.75rem', 
              borderRadius: '0.375rem', 
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Iniciar sesión
          </button>
        </form>
        
        <div style={{ 
          marginTop: '1.5rem', 
          fontSize: '0.875rem', 
          color: '#6b7280',
          textAlign: 'center'
        }}>
          <p>Credenciales de prueba:</p>
          <p style={{ marginTop: '0.5rem' }}>Admin: admin@sistema.com / admin123</p>
          <p>Gestor: gestor@sistema.com / gestor123</p>
          <p>Usuario: usuario@sistema.com / usuario123</p>
        </div>
      </div>
    </div>
  );
} 