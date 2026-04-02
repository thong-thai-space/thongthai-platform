import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.png" }];
  },
  // Pattern: Image Optimization - Configure external image sources
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.thongthaispace.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.thongthaispace.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
