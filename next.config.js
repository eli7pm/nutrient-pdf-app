// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as a standalone application
  output: 'standalone',
  
  // Configure webpack to handle WASM files
  webpack: (config, { isServer }) => {
    // Add WASM file handling
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Copy WASM files from node_modules to the output directory
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        // Externalize all @nutrient-sdk dependencies
        if (request.startsWith('@nutrient-sdk')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }
    
    // Return the modified config
    return config;
  },
  
  // External packages
  experimental: {
    serverExternalPackages: ['@nutrient-sdk/node'],
    memoryBasedWorkersCount: true,
  },
};

module.exports = nextConfig;