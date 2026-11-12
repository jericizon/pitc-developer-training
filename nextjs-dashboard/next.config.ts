import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: { root: __dirname },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${process.env.API_PORT ?? 3001}/:path*`,
      },
    ];
  },
};

export default nextConfig;
