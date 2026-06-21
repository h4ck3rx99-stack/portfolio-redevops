import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/siteaudit',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
