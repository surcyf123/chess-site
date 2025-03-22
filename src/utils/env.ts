// Environment variable validation utility

/**
 * Validates required environment variables and provides defaults for optional ones
 * @returns Environment configuration object
 */
export function validateEnv() {
  // Required variables
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please provide these variables in your .env file or deployment environment');
    
    // In development, we can be more forgiving and provide fallbacks
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Running in development mode with fallback values');
    } else {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  // Return environment configuration with defaults
  return {
    // Database
    databaseUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    
    // Socket.IO
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    
    // CORS
    allowedOrigins: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || '*', 'http://localhost:3000']
      : '*'
  };
}

// Export a singleton instance for use throughout the app
export const env = validateEnv(); 