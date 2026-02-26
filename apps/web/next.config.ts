import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    devtoolSegmentExplorer: false
  },
  transpilePackages: ['@contenthead/sdk']
};

export default nextConfig;
