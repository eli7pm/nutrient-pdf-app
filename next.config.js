// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
  // Tell Next.js to transpile the Nutrient SDK
  transpilePackages: ['@nutrient-sdk/node'],
  // Configure serverless functions
  experimental: {
    serverExternalPackages: ['@nutrient-sdk/node']
  }
};

module.exports = nextConfig;