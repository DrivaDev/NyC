import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['cloudinary', 'mongoose'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
