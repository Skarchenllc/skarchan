/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/production',
  assetPrefix: '/production',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/production/:path*',
        destination: process.env.PRODUCTION_BACKEND_URL
          ? `${process.env.PRODUCTION_BACKEND_URL}/api/v1/:path*`
          : 'http://production-backend:8000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
