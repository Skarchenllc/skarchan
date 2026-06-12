/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/sales',
  assetPrefix: '/sales',
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
