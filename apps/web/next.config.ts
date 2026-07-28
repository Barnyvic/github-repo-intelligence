import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Monorepo: silence multi-lockfile root inference on Render
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
