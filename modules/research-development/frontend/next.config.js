/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/rd',
  assetPrefix: '/rd',
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
        destination: 'http://core-backend:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
