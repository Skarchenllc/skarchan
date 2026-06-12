/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/customer-service',
  assetPrefix: '/customer-service',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://customer-service-backend:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
