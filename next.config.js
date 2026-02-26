/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' убран, так как нам нужны API Routes
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Оптимизация для статической сборки - убираем проблемные настройки
  // generateBuildId: async () => {
  //   return 'build-cache-' + Date.now()
  // },
  // Уменьшение размера бандла
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Настройки для лучшей производительности сборки
  webpack: (config, { isServer }) => {
    // Оптимизация для клиентской сборки - упрощаем настройки
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      }
    }

    // Упрощаем оптимизацию бандла
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    }

    return config
  },
  // Убираем потенциально проблемные настройки экспорта
  // exportPathMap: async function (defaultPathMap) {
  //   return defaultPathMap
  // },
}

module.exports = nextConfig