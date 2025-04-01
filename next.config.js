// next.config.js
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE_BUNDLE === 'true'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Add the output file tracing for the Nutrient SDK WASM files
    outputFileTracingIncludes: {
      '/api/convert': ['node_modules/@nutrient-sdk/node/**/*']
    },
    // Keep your existing asyncWebAssembly setting
    asyncWebAssembly: true,
    // Add serverComponentsExternalPackages if needed
    serverComponentsExternalPackages: ['@nutrient-sdk/node']
  },
  webpack: (config, { isServer }) => {
    // Keep the existing WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Explicitly handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]',
      },
    });

    // If running on the server, externalize @nutrient-sdk/node
    if (isServer) {
      config.externals.push('@nutrient-sdk/node');
    }
    
    // Add fallbacks for browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  },
  // Output standalone to include dependencies
  output: 'standalone'
};

export default withBundleAnalyzer(nextConfig);