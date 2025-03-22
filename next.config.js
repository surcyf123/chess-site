/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  poweredByHeader: false,
  swcMinify: true,
  transpilePackages: ['chess.js'],
  webpack: (config, { isServer, dev }) => {
    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      path: false
    };
    
    // Fix for chess.js module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'chess.js': require.resolve('chess.js')
    };
    
    // Optimize for production
    if (!dev) {
      config.optimization.minimize = true;
    }
    
    return config;
  },
  // Handle the chess.js module in production
  experimental: {
    serverComponentsExternalPackages: ['chess.js']
  }
};

module.exports = nextConfig; 