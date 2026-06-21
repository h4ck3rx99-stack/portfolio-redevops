import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/brandkit',
  images: { unoptimized: true }
};

export default nextConfig;
