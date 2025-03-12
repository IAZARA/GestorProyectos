/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['i.pravatar.cc'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'bcrypt'];
    return config;
  },
};

module.exports = nextConfig; 