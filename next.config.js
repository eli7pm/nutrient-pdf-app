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
  // Ensure the Nutrient SDK is included in the API route
  experimental: {
    esmExternals: 'loose',
  }
};

module.exports = nextConfig;