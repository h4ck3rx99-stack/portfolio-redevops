import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/dashboard-studio',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
