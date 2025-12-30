const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        }
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't reject if missing
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
}

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    config.security.jwtSecret,
    { expiresIn: '7d' }
  );
}

/**
 * Socket.IO authentication middleware
 */
function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication token required'));
  }
  
  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (err) {
      return next(new Error('Invalid authentication token'));
    }
    socket.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  socketAuth
};
