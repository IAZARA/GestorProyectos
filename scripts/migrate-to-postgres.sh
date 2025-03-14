#!/bin/bash

# Script para migrar de MongoDB a PostgreSQL
# Este script ejecuta todos los pasos necesarios para migrar los datos

echo "=== Iniciando migración de MongoDB a PostgreSQL ==="

# 1. Instalar dependencias necesarias
echo -e "\n=== 1. Instalando dependencias necesarias ==="
npm install pg knex dotenv

# 2. Inicializar la base de datos PostgreSQL
echo -e "\n=== 2. Inicializando la base de datos PostgreSQL ==="
node scripts/init-postgres.js

# 3. Ejecutar migraciones
echo -e "\n=== 3. Ejecutando migraciones ==="
node scripts/run-migrations.js

# 4. Migrar datos de MongoDB a PostgreSQL
echo -e "\n=== 4. Migrando datos de MongoDB a PostgreSQL ==="
node scripts/migrate-mongo-to-postgres.js

# 5. Verificar la migración
echo -e "\n=== 5. Verificando la migración ==="
echo "Contando registros en PostgreSQL..."

# Crear un script temporal para contar registros
cat > scripts/count-records.js << 'EOF'
const knex = require('knex');
const dbConfig = require('../config/database');

async function countRecords() {
  const pg = knex(dbConfig);
  
  try {
    const tables = ['users', 'projects', 'project_members', 'events', 'event_attendees', 'event_attachments', 'notifications'];
    
    for (const table of tables) {
      const count = await pg(table).count('* as count').first();
      console.log(`Tabla ${table}: ${count.count} registros`);
    }
  } catch (error) {
    console.error('Error al contar registros:', error);
  } finally {
    await pg.destroy();
  }
}

countRecords().catch(console.error);
EOF

# Ejecutar el script temporal
node scripts/count-records.js

echo -e "\n=== Migración completada ==="
echo "La migración de MongoDB a PostgreSQL ha sido completada con éxito."
echo "Ahora puedes iniciar la aplicación con la nueva base de datos." 