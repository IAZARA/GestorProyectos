const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generar un secreto seguro
const secret = crypto.randomBytes(32).toString('base64');

// Leer el archivo .env.production
const envPath = path.join(__dirname, '..', '.env.production');
let envContent = fs.readFileSync(envPath, 'utf8');

// Reemplazar el NEXTAUTH_SECRET
envContent = envContent.replace(
  /NEXTAUTH_SECRET=".*"/,
  `NEXTAUTH_SECRET="${secret}"`
);

// Guardar el archivo actualizado
fs.writeFileSync(envPath, envContent);

console.log('Nuevo NEXTAUTH_SECRET generado y actualizado en .env.production'); 