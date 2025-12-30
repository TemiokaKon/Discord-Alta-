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
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    bcryptRounds: 10
  },

  // Database
  database: {
    path: process.env.DB_PATH || './data/alta-base.db'
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
    // JWT Secret validation
    if (!config.security.jwtSecret) {
      errors.push('JWT_SECRET must be set in production');
    } else if (config.security.jwtSecret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters');
    }

    // Session Secret validation
    if (!config.security.sessionSecret) {
      errors.push('SESSION_SECRET must be set in production');
    } else if (config.security.sessionSecret.length < 32) {
      errors.push('SESSION_SECRET should be at least 32 characters');
    }

    // Database path validation
    if (!process.env.DB_PATH) {
      errors.push('DB_PATH must be set in production (recommended: /var/lib/alta52/alta52.db)');
    }
  } else {
    // In development, provide defaults if not set
    if (!config.security.jwtSecret) {
      config.security.jwtSecret = 'dev-jwt-secret-change-in-production-min-32-chars';
      console.warn('⚠️  Using default JWT_SECRET for development. Set JWT_SECRET in production!');
    }
    if (!config.security.sessionSecret) {
      config.security.sessionSecret = 'dev-session-secret-change-in-production-min-32-chars';
      console.warn('⚠️  Using default SESSION_SECRET for development. Set SESSION_SECRET in production!');
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
