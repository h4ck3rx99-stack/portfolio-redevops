import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/proposalforge',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
