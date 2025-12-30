const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const config = require('../config/environment');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  
  res.json({
    success: true,
    data: { user },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', validate(schemas.updateProfile), asyncHandler(async (req, res) => {
  const updates = req.body;
  
  // Check if username is already taken (if updating username)
  if (updates.username && updates.username !== req.user.username) {
    const existing = await userModel.findByUsername(updates.username);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username is already taken',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  await userModel.update(req.user.id, updates);
  const user = await userModel.findById(req.user.id);
  
  res.json({
    success: true,
    data: { user },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', validate(schemas.id, 'params'), asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.params.id);
  
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
    data: { user },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (with pagination)
 * @access  Private
 */
router.get('/', validate(schemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userModel.getAll(page, limit);
  
  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/users/search/:query
 * @desc    Search users
 * @access  Private
 */
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const users = await userModel.search(query);
  
  res.json({
    success: true,
    data: { users },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/users/me/status
 * @desc    Update user status
 * @access  Private
 */
router.put('/me/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['online', 'away', 'dnd', 'invisible'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: 'Invalid status value',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  await userModel.updateStatus(req.user.id, status);
  
  res.json({
    success: true,
    data: { status },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/users/me/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/me/password', validate(schemas.changePassword), asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await userModel.findByIdWithPassword(req.user.id);
  
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
  
  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  
  // Update password
  await userModel.updatePassword(req.user.id, hashedPassword);
  
  res.json({
    success: true,
    data: { message: 'Password changed successfully' },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
