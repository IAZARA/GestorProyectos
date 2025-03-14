/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['i.pravatar.cc'],
  },
  webpack: (config, { isServer }) => {
    // Resolver el problema de importación de oracledb en Knex.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      oracledb: false,
      pg: false,
      'pg-query-stream': false,
      tedious: false,
      mysql: false,
      'mysql2/promises': false,
      'better-sqlite3': false,
      sqlite3: false
    };
    
    return config;
  },
  // Resolver el problema de páginas duplicadas
  experimental: {
    // La opción appDir ya no es necesaria en Next.js 14
    serverComponentsExternalPackages: ['knex', 'pg']
  }
};

module.exports = nextConfig; 