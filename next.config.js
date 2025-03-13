/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.pravatar.cc'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'bcrypt'];
    return config;
  },
  // Excluir rutas de la generación estática
  experimental: {
    serverActions: true,
  },
  // Configurar rutas dinámicas
  async rewrites() {
    return [
      {
        source: '/api/users/verify',
        destination: '/api/users/verify',
      },
    ];
  },
};

module.exports = nextConfig; 