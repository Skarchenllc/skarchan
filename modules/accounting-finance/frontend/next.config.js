/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/accounting',
  assetPrefix: '/accounting',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  images: {
    domains: ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8002',
        pathname: '/static/uploads/**',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Accounting-specific API routes go directly to Accounting backend
        {
          source: '/api/accounting/:path*',
          destination: 'http://accounting-backend:8000/api/v1/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
