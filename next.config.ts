import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // exFAT filesystem does not support symlinks, causing EISDIR errors with webpack.
  // Use Turbopack for dev/build. Keep webpack config as fallback for NTFS environments.
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };
    return config;
  },
};

export default nextConfig;
