/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  poweredByHeader: false,
  swcMinify: true,
  transpilePackages: ['chess.js'],
  webpack: (config, { isServer, webpack }) => {
    // Provide fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      'child_process': false,
      path: false
    };

    // Add specific chess.js aliases to handle different module formats
    config.resolve.alias = {
      ...config.resolve.alias,
      'chess.js': require.resolve('chess.js')
    };

    // Handle chess.js with babel-loader instead of next's default loaders
    config.module.rules.push({
      test: /chess\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          compact: true
        }
      }
    });

    // Add a plugin to analyze module failures in browser
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG || ''),
      })
    );

    // Add optimization for production
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true
      };
    }

    return config;
  },
  // Handle the chess.js module in production
  experimental: {
    serverComponentsExternalPackages: ['chess.js'],
    esmExternals: 'loose'
  },
  // Ensure the browser field in package.json is respected
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    NODE_ENV: process.env.NODE_ENV,
  }
};

module.exports = nextConfig; 