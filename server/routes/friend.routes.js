const express = require('express');
const router = express.Router();
const { getDatabase, DatabaseWrapper } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticateToken);

const db = new DatabaseWrapper(getDatabase());

/**
 * @route   GET /api/v1/friends
 * @desc    Get user's friends
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const friends = await db.all(
    `SELECT u.id, u.username, u.avatar, u.status, u.custom_status, f.status as friendship_status
     FROM friends f
     INNER JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
     WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ? AND f.status = 'accepted'
     GROUP BY u.id`,
    [req.user.id, req.user.id, req.user.id]
  );
  
  res.json({
    success: true,
    data: { friends },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/friends/pending
 * @desc    Get pending friend requests
 * @access  Private
 */
router.get('/pending', asyncHandler(async (req, res) => {
  const pending = await db.all(
    `SELECT u.id, u.username, u.avatar, u.status, f.created_at
     FROM friends f
     INNER JOIN users u ON f.user_id = u.id
     WHERE f.friend_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  
  res.json({
    success: true,
    data: { pending },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/friends/sent
 * @desc    Get sent friend requests
 * @access  Private
 */
router.get('/sent', asyncHandler(async (req, res) => {
  const sent = await db.all(
    `SELECT u.id, u.username, u.avatar, u.status, f.created_at
     FROM friends f
     INNER JOIN users u ON f.friend_id = u.id
     WHERE f.user_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  
  res.json({
    success: true,
    data: { sent },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/friends/:userId
 * @desc    Send friend request
 * @access  Private
 */
router.post('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (parseInt(userId) === req.user.id) {
    throw createError('Cannot add yourself as friend', 400, 'INVALID_REQUEST');
  }
  
  // Check if already friends or request exists
  const existing = await db.get(
    `SELECT * FROM friends 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
    [req.user.id, userId, userId, req.user.id]
  );
  
  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_FRIENDS',
          message: 'You are already friends',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REQUEST_EXISTS',
          message: 'Friend request already exists',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  await db.run(
    'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
    [req.user.id, userId, 'pending']
  );
  
  res.status(201).json({
    success: true,
    data: { message: 'Friend request sent' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/friends/:userId/accept
 * @desc    Accept friend request
 * @access  Private
 */
router.put('/:userId/accept', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const request = await db.get(
    'SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?',
    [userId, req.user.id, 'pending']
  );
  
  if (!request) {
    throw createError('Friend request not found', 404, 'REQUEST_NOT_FOUND');
  }
  
  await db.run(
    'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
    ['accepted', userId, req.user.id]
  );
  
  res.json({
    success: true,
    data: { message: 'Friend request accepted' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/friends/:userId
 * @desc    Reject friend request or remove friend
 * @access  Private
 */
router.delete('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  await db.run(
    `DELETE FROM friends 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
    [req.user.id, userId, userId, req.user.id]
  );
  
  res.json({
    success: true,
    data: { message: 'Friend removed' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/friends/:userId/status
 * @desc    Check friendship status with a user
 * @access  Private
 */
router.get('/:userId/status', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const friendship = await db.get(
    `SELECT * FROM friends 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
    [req.user.id, userId, userId, req.user.id]
  );
  
  let status = 'none';
  let direction = null;
  
  if (friendship) {
    if (friendship.status === 'accepted') {
      status = 'friends';
    } else if (friendship.user_id === req.user.id) {
      status = 'pending';
      direction = 'outgoing';
    } else {
      status = 'pending';
      direction = 'incoming';
    }
  }
  
  res.json({
    success: true,
    data: { status, direction },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
