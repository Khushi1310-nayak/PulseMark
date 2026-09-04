/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pulsemark/shared'],
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const cleanBaseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanBaseUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
