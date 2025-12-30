require('dotenv').config();

/**
 * Environment configuration module
 * Centralizes all environment variables with validation and defaults
 */

const config = {
  // Server Configuration
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
    domain: process.env.DOMAIN || 'dis-alta.ru',
    protocol: process.env.PROTOCOL || 'https'
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || '6vHKASDi95nHGqjewGHKSASDlj:0oGHGuA7GHKSASDHGGHKSASDGHKSASD1zpjGko8:X:',
    sessionSecret: process.env.SESSION_SECRET || '6vHKASDi95nHGqjewGHKSASDlj:0oGHGuA7GHKSASDHGGHKSASDGHKSASD1zpjGko8:X:X',
    bcryptRounds: 10
  },

  // Database
  database: {
    path: process.env.DB_PATH || './data/alta52.db'
  },

  // Upload Configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10485760, // 10MB
    path: process.env.UPLOAD_PATH || './uploads'
  },

  // WebRTC
  webrtc: {
    turnServerUrl: process.env.TURN_SERVER_URL || '',
    turnUsername: process.env.TURN_USERNAME || '',
    turnPassword: process.env.TURN_PASSWORD || ''
  },

  // Rate Limiting
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15) * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },

  // Computed values
  get baseUrl() {
    return `${this.server.protocol}://${this.server.domain}`;
  },

  get isDevelopment() {
    return this.server.env === 'development';
  },

  get isProduction() {
    return this.server.env === 'production';
  }
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const errors = [];

  if (config.isProduction) {
    if (config.security.jwtSecret === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (config.security.jwtSecret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    if (config.isProduction) {
      process.exit(1);
    }
  }
}

validateConfig();

module.exports = config;
