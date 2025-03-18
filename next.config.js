// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable static exports
    output: 'standalone',
    
    // Configure webpack
    webpack: (config, { isServer }) => {
      // Handle specific file imports
      config.resolve.alias = {
        ...config.resolve.alias,
        // Add any specific aliases if needed
      };
      
      // Ignore specific module imports that might cause issues
      config.module = {
        ...config.module,
        exprContextCritical: false,
        unknownContextCritical: false,
      };
      
      // Return the modified config
      return config;
    },
    
    // Increase the API route body size limit for file uploads
    experimental: {
      serverComponentsExternalPackages: ['@nutrient-sdk/node'],
      memoryBasedWorkersCount: true,
    },
  };
  
  module.exports = nextConfig;