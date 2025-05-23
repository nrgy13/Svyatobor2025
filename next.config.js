/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    domains: ['ytbtznozmjlifztitlas.supabase.co'],
    unoptimized: true
  },
  webpack: (config, { dev }) => {
    // Disable filesystem cache to prevent ENOENT errors
    config.cache = false;
    return config;
  }
};

module.exports = nextConfig;