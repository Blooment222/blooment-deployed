const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // Deshabilitado para mejorar performance
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Comprimir salidas
  compress: true,
  // Deshabilitar x-powered-by header
  poweredByHeader: false,
  // Optimizaciones de build
  swcMinify: true,
  experimental: {
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
    // Deshabilitado para reducir uso de memoria
    optimizeCss: false,
  },
  webpack(config, { dev, isServer }) {
    // Optimizaciones de producción
    if (!dev && !isServer) {
      // Remover console.log en producción
      config.optimization.minimizer.forEach((plugin) => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions.compress.drop_console = true
        }
      })
    }
    
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      }
    }
    return config
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
          // Cache headers para assets estáticos
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache para API de productos (5 minutos)
        source: "/api/productos",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ]
  },
}

module.exports = nextConfig

