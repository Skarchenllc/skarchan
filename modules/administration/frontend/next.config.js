/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/administration',
  assetPrefix: '/administration',
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: '/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.ADMINISTRATION_BACKEND_URL || 'http://administration-backend:8000'}/api/v1/:path*`,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
