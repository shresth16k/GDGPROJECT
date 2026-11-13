import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', 'bcryptjs', 'exceljs'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
