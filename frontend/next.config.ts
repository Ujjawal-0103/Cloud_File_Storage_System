import type { NextConfig } from "next";

import path from "path";

const isProductionDeploy = Boolean(process.env.RENDER || process.env.VERCEL);
const rawBackendUrl = process.env.BACKEND_URL;

if (isProductionDeploy && !rawBackendUrl) {
  throw new Error(
    '[CloudRage Production Configuration Error] BACKEND_URL environment variable is missing on Render!\n' +
    'The production frontend cannot communicate with localhost. Please configure BACKEND_URL in your Render Web Service Environment Variables with your deployed Render backend URL: https://cloudrage-backend.onrender.com'
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