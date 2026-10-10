import type { NextConfig } from "next";

import path from "path";

const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
const rawBackendUrl = process.env.BACKEND_URL;

if (isVercel && !rawBackendUrl) {
  throw new Error(
    '[CloudRage Production Configuration Error] BACKEND_URL environment variable is missing on Vercel!\n' +
    'The production frontend cannot communicate with localhost. Please configure BACKEND_URL in your Vercel Project Settings -> Environment Variables with your deployed Render backend URL (e.g., https://your-backend.onrender.com).'
  );
}

const backendUrl = (rawBackendUrl || 'http://localhost:3001').replace(/\/$/, '');

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