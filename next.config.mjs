// next.config.js
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';


const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE_BUNDLE === 'true'
});


/** @type {import('next').NextConfig} */
const BASE_NEXT_CONFIG = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      // Ensure the wasm file for @nutrient-sdk/node is included in the build
      // https://dev.to/mfts/deploy-a-webassembly-powered-nextjs-app-on-vercel-serverless-functions-20b0
      // NOTE: This must match the current version of the nutrient-sdk NPM package
      '/api/ingest/convertAttachments': ['node_modules/.pnpm/@nutrient-sdk+node@1.0.0/node_modules/@nutrient-sdk/node/**/*'],
      '/api/ingest/processAttachment': ['node_modules/.pnpm/@nutrient-sdk+node@1.0.0/node_modules/@nutrient-sdk/node/**/*']
    },
    serverComponentsExternalPackages: ['pdfjs-dist', '@napi-rs/canvas', '@elastic/elasticsearch-serverless', 'tiktoken']
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'etl']
  },
  images: {
    remotePatterns: [
      // … Hidden
    ]
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en'
  },
  async redirects() {
    return [
      {
        source: '/companies',
        destination: '/',
        permanent: false
      },
      {
        source: '/applicant-tracking-systems',
        destination: '/ats',
        permanent: false
      }
      // ,
      // {
      //   source: '/ai-resume-screening-software',
      //   destination: '/',
      //   permanent: false
      // }
    ];
  },
  async rewrites() {
    return [
      // We need to keep these for session replays still
      {
        source: '/observe/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*'
      },
      {
        source: '/observe/:path*',
        destination: 'https://us.i.posthog.com/:path*'
      },
      // Segment Reverse Proxy
      {
        source: '/sobserve/cdn/:path*',
        destination: 'https://cdn.segment.com/:path*'
      },
      {
        source: '/sobserve/api/:path*',
        destination: 'https://api.segment.io/:path*'
      }
      // ,


      // // Webflow proxies
      // {
      //   source: '/blog/:path*',
      //   destination: 'https://endorsed-staging.webflow.io/blog/:path*'
      // }
    ];
  },
  // https://github.com/hwchase17/langchainjs/issues/943#issuecomment-1544928533
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    if (isServer) {
      // Externalize @nutrient-sdk/node to prevent it from being bundled on the server
      // This resolves issues with dependencies that are not compatible with webpack
      // See: https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
      // Before I was getting this error:
      // Failed to compile
      // https://deno.land/std/path/mod.ts
      // Module build failed: UnhandledSchemeError: Reading from "https://deno.land/std/path/mod.ts" is not handled by plugins (Unhandled scheme).
      config.externals.push('@nutrient-sdk/node');
    }


    // https://github.com/Automattic/node-canvas/issues/2135
    config.resolve.alias.canvas = false;


    // Exclude THREE.js and globe.gl from server-side bundles
    if (isServer) {
      config.externals.push('three', 'globe.gl');
    }


    config.externals = [...config.externals, 'hnswlib-node'];


    config.module.rules.push(
      // Used for pdfjs-dist@^2.16 support
      // https://community.frontity.org/t/help-with-webpack-and-reading-pdf-files/4656/10
      // https://webpack.js.org/loaders/node-loader/
      {
        test: /\.pdf$/,
        use: ['file-loader']
      },
      // Used for pdfjs-dist@^2.16 support
      {
        test: /\.node$/,
        use: ['node-loader']
      }
    );


    // The idea here is to tell Webpack to not bother trying to polyfill or mock the encoding module.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // These are default settings
        net: false, // These are default settings
        tls: false, // These are default settings
        encoding: false
      };
    }

    // Explicitly handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]',
      },
    });



    return config;
  },
    // Output standalone to include dependencies
    output: 'standalone'

};


// Only apply Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true';


let nextConfig = withBundleAnalyzer(BASE_NEXT_CONFIG);


// Conditionally apply Sentry config
if (shouldUseSentry) {
  nextConfig = withSentryConfig(
    nextConfig,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options


      // Suppresses source map uploading logs during build
      silent: true,
      org: 'showspace',
      project: 'endorsed-nextjs'
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/


      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,


      // Consider setting to false if IE11 support is not needed
      transpileClientSDK: false,


      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitoring',


      // Hides source maps from generated client bundles
      hideSourceMaps: true,


      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,


      // Enables automatic instrumentation of Vercel Cron Monitors.
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true
    }
  );
}


export default nextConfig;



