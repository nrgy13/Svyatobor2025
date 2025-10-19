/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Оптимизация для статической сборки
  generateBuildId: async () => {
    return 'build-cache-' + Date.now()
  },
  // Уменьшение размера бандла
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Настройки для лучшей производительности сборки
  webpack: (config, { isServer }) => {
    // Оптимизация для клиентской сборки
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

    // Уменьшение размера бандла
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    }

    return config
  },
  // Настройки для экспорта статических файлов
  exportPathMap: async function (defaultPathMap) {
    return defaultPathMap
  },
}

module.exports = nextConfig