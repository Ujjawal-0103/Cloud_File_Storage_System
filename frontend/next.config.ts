import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:3001/api/:path*', // Points to your NestJS backend with global prefix /api
      },
    ];
  },
};

export default nextConfig;