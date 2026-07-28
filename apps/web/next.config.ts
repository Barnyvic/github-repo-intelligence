import type { NextConfig } from 'next';
import path from 'path';

const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  // Monorepo: silence multi-lockfile root inference on Render
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async rewrites() {
    if (!apiOrigin) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
