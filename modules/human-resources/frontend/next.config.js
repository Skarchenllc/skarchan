/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/hr',
  assetPrefix: '/hr',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8005',
        pathname: '/uploaded-files/**',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // HR-specific API routes go directly to HR backend
        {
          source: '/api/hr/:path*',
          destination: 'http://hr-backend:8000/api/v1/:path*',
        },
      ],
      afterFiles: [
        // All other /api routes go through the core API
        {
          source: '/api/:path((?!hr).*)*',
          destination: 'http://core-backend:8000/api/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
