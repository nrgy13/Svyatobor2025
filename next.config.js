/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Disable filesystem cache to prevent ENOENT errors
    config.cache = false;
    return config;
  },
  images: {
    domains: ['images.pexels.com'],
    unoptimized: true
  }
};

module.exports = nextConfig;
