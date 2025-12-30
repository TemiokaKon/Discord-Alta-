const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

/**
 * Configure Helmet for security headers
 */
function configureHelmet() {
  const config = require('../config/environment');
  
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],
        scriptSrc: config.isProduction 
          ? ["'self'", "https://cdnjs.cloudflare.com"]
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
        fontSrc: [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
          "https://fonts.googleapis.com"
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'", 
          "wss:",
          "ws:",
          "https:",
          "http:"
        ],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
}

/**
 * Rate limiter for general API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // <--- Увеличим лимит попыток для тестов (было 5)
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later',
      timestamp: new Date().toISOString()
    }
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Too many uploads, please try again later',
      timestamp: new Date().toISOString()
    }
  }
});

/**
 * CORS configuration
 */
function configureCors() {
  const config = require('../config/environment');
  
  if (config.isProduction) {
    // Production: use whitelist from environment variable
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [config.baseUrl, `https://${config.server.domain}`];
    
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    };
  } else {
    // Development: permissive CORS
    return {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    };
  }
}

/**
 * Input sanitization middleware
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/[<>]/g, '') 
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}

module.exports = {
  configureHelmet,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  configureCors,
  sanitizeInput
};