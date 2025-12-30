const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const userModel = require('../models/user.model');
const { generateToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const config = require('../config/environment');
const { logger } = require('../config/logger');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      }
    });
  }

  const existingUsername = await userModel.findByUsername(username);
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: 'Username is already taken',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

  // Create user
  const userId = await userModel.create({
    username,
    email,
    password: hashedPassword,
    avatar: username.charAt(0).toUpperCase()
  });

  // Generate token
  const user = await userModel.findById(userId);
  const token = generateToken(user);

  logger.info('User registered', { userId, username, email });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      },
      token
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Find user by email or username
    let user;
    if (email) {
      user = await userModel.findByEmail(email);
    } else if (username) {
      user = await userModel.findByUsername(username);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    logger.info('User logged in', { userId: user.id, username: user.username });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          custom_status: user.custom_status
        },
        token
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error during login',
        timestamp: new Date().toISOString()
      }
    });
  }
}));

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify token and get current user
 * @access  Private
 */
router.get('/verify', require('../middleware/auth.middleware').authenticateToken, asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      }
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        custom_status: user.custom_status
      }
    },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
