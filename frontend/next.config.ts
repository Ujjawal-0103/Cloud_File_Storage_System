import type { NextConfig } from "next";

import path from "path";

const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;