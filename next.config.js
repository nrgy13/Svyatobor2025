/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Disable filesystem cache to prevent ENOENT errors
    config.cache = false;
    return config;
  },
  images: {
    domains: ['ytbtznozmjlifztitlas.supabase.co'],
    unoptimized: true
  }
};

module.exports = nextConfig;