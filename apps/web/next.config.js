const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pulsemark/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@pulsemark/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
  async rewrites() {
    let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    let cleanBaseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    // Auto-fix accidental typos like httmp:// or missing http://
    if (cleanBaseUrl.startsWith('httmp://')) {
      cleanBaseUrl = cleanBaseUrl.replace('httmp://', 'http://');
    } else if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
      cleanBaseUrl = `http://${cleanBaseUrl}`;
    }

    return [
      {
        source: '/api/:path*',
        destination: `${cleanBaseUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
