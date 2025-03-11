export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Gestor de Proyectos
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Sistema de gestión de proyectos colaborativo
        </p>
        <a 
          href="/login" 
          style={{ 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.375rem', 
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Iniciar sesión
        </a>
      </div>
    </div>
  );
} 