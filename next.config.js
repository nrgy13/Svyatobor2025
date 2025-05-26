/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    domains: ['ytbtznozmjlifztitlas.supabase.co'],
    unoptimized: true,
    // Добавляем конфигурацию для приоритетной загрузки
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  webpack: (config, { dev }) => {
    // Disable filesystem cache to prevent ENOENT errors
    config.cache = false;
    return config;
  }
};

module.exports = nextConfig;