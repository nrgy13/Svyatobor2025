/** @type {import('next').NextConfig} */
const nextConfig = {
  // Используем standalone режим для деплоя в Docker/Node.js
  output: 'standalone',
  trailingSlash: false, // Явно отключаем

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'xn--90ab0bbkbi7h.online',
        'svyatobor.online',
        'n8n.lex1case.ru'
      ],
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  images: {
    unoptimized: true,
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

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

  async headers() {
    return [
      {
        // Разрешаем API Routes для всех источников (или конкретных)
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
