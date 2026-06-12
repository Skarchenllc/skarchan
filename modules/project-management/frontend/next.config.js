/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/pm',
  assetPrefix: '/pm',
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
        destination: 'http://project-management-backend:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
