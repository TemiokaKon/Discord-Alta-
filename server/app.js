const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const fs = require('fs');

// Import configuration
const config = require('./config/environment');
const { logger, requestLogger } = require('./config/logger');
const { initializeDatabase } = require('./config/database');

// Import middleware
const { 
  configureHelmet, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter,
  configureCors,
  sanitizeInput 
} = require('./middleware/security.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const serverRoutes = require('./routes/server.routes');
const messageRoutes = require('./routes/message.routes');
const friendRoutes = require('./routes/friend.routes');

/**
 * Create Express application
 */
async function createApp() {
  const app = express();

  // Initialize database
  await initializeDatabase();

  // Trust proxy (for nginx)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(configureHelmet());
  app.use(cors(configureCors()));

  // Compression
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Input sanitization
  app.use(sanitizeInput);

  // Create uploads directory
  const uploadsDir = config.upload.path;
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: config.upload.maxSize },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'audio/mpeg', 'audio/mp3', 'video/mp4', 'video/webm', 'video/quicktime',
        'application/zip', 'application/x-rar-compressed'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not supported. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
      }
    }
  });

  // Make upload middleware available
  app.locals.upload = upload;

  // API Routes with rate limiting
  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/users', apiLimiter, userRoutes);
  app.use('/api/v1/servers', apiLimiter, serverRoutes);
  app.use('/api/v1/messages', apiLimiter, messageRoutes);
  app.use('/api/v1/friends', apiLimiter, friendRoutes);
  
  // Backward compatibility for /api/* paths (without v1)
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', apiLimiter, userRoutes);
  app.use('/api/servers', apiLimiter, serverRoutes);
  app.use('/api/messages', apiLimiter, messageRoutes);
  app.use('/api/friends', apiLimiter, friendRoutes);

  // File upload endpoint
  app.post('/api/v1/upload', 
    uploadLimiter,
    require('./middleware/auth.middleware').authenticateToken,
    upload.single('file'),
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        },
        timestamp: new Date().toISOString()
      });
    }
  );

  // Serve uploads
  app.use('/uploads', express.static(uploadsDir));

  // Serve static files (client)
  app.use(express.static(path.join(__dirname, '..', 'client')));
  app.use('/modals', express.static(path.join(__dirname, '..', 'modals')));
  app.use('/utils', express.static(path.join(__dirname, '..', 'utils')));
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  });

  // API info endpoint
  app.get('/api/v1', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'Alta52 API',
        version: '3.0.0',
        description: 'Ruby-themed Discord-like messenger API',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          servers: '/api/v1/servers',
          messages: '/api/v1/messages',
          friends: '/api/v1/friends'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
