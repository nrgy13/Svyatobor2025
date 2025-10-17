/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bvuagbjdedtfmvitrfpa.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Оптимизации для продакшена
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Настройки для корректной работы critters в Next.js 14
  experimental: {
    optimizeCss: {
      critters: false // Отключаем critters для избежания ошибок сборки
    },
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
  // Настройки для статического хостинга Timeweb
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
};

module.exports = nextConfig;