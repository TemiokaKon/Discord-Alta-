const express = require('express');
const router = express.Router();
const messageModel = require('../models/message.model');
const serverModel = require('../models/server.model');
const { getDatabase, DatabaseWrapper } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticateToken);

const db = new DatabaseWrapper(getDatabase());

/**
 * Helper function to check if user has access to channel
 */
async function checkChannelAccess(userId, channelId) {
  // Get channel's server
  const channel = await db.get('SELECT server_id FROM channels WHERE id = ?', [channelId]);
  
  if (!channel) {
    throw createError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
  }
  
  // Check if user is member of the server
  const isMember = await serverModel.isMember(channel.server_id, userId);
  
  if (!isMember) {
    throw createError('Access denied to this channel', 403, 'ACCESS_DENIED');
  }
  
  return true;
}

/**
 * @route   GET /api/v1/messages/channel/:channelId
 * @desc    Get messages for a channel
 * @access  Private
 */
router.get('/channel/:channelId', validate(schemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page, limit } = req.query;
  
  // Verify user has access to this channel
  await checkChannelAccess(req.user.id, channelId);
  
  const result = await messageModel.getByChannel(channelId, page, limit);
  
  res.json({
    success: true,
    data: result.messages,
    pagination: result.pagination,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/messages/channel/:channelId
 * @desc    Send message to a channel
 * @access  Private
 */
router.post('/channel/:channelId', validate(schemas.sendMessage), asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;
  
  // Verify user has access to this channel
  await checkChannelAccess(req.user.id, channelId);
  
  const messageId = await messageModel.create(content, req.user.id, channelId);
  const message = await messageModel.findById(messageId);
  
  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/messages/:id
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:id', validate(schemas.id, 'params'), validate(schemas.editMessage), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  const message = await messageModel.findById(id);
  
  if (!message) {
    throw createError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }
  
  if (message.user_id !== req.user.id) {
    throw createError('You can only edit your own messages', 403, 'ACCESS_DENIED');
  }
  
  await messageModel.update(id, content);
  const updatedMessage = await messageModel.findById(id);
  
  res.json({
    success: true,
    data: { message: updatedMessage },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:id', validate(schemas.id, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const message = await messageModel.findById(id);
  
  if (!message) {
    throw createError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }
  
  if (message.user_id !== req.user.id) {
    throw createError('You can only delete your own messages', 403, 'ACCESS_DENIED');
  }
  
  await messageModel.delete(id);
  
  res.json({
    success: true,
    data: { message: 'Message deleted successfully' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/messages/:id/reactions
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/:id/reactions', asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const { emoji } = req.body;
  
  if (!emoji) {
    throw createError('Emoji is required', 400, 'MISSING_EMOJI');
  }
  
  const added = await messageModel.addReaction(messageId, req.user.id, emoji);
  
  if (!added) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ALREADY_REACTED',
        message: 'You already reacted with this emoji',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  const reactions = await messageModel.getReactions(messageId);
  
  res.status(201).json({
    success: true,
    data: { reactions },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/messages/:id/reactions/:emoji
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/:id/reactions/:emoji', asyncHandler(async (req, res) => {
  const { id: messageId, emoji } = req.params;
  
  await messageModel.removeReaction(messageId, req.user.id, emoji);
  
  const reactions = await messageModel.getReactions(messageId);
  
  res.json({
    success: true,
    data: { reactions },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/messages/search/:channelId
 * @desc    Search messages in channel
 * @access  Private
 */
router.get('/search/:channelId', asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { q: query } = req.query;
  
  if (!query) {
    throw createError('Search query is required', 400, 'MISSING_QUERY');
  }
  
  const messages = await messageModel.search(channelId, query);
  
  res.json({
    success: true,
    data: { messages },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/messages/dm/:userId
 * @desc    Get direct messages with a user
 * @access  Private
 */
router.get('/dm/:userId', validate(schemas.pagination, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  
  const result = await messageModel.getDMs(req.user.id, userId, page, limit);
  
  res.json({
    success: true,
    data: result.messages,
    pagination: result.pagination,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/messages/dm/:userId
 * @desc    Send direct message to a user
 * @access  Private
 */
router.post('/dm/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    throw createError('Message content is required', 400, 'MISSING_CONTENT');
  }
  
  const messageId = await messageModel.createDM(content, req.user.id, userId);
  
  res.status(201).json({
    success: true,
    data: { messageId },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/messages/dm/:userId/read
 * @desc    Mark DMs as read
 * @access  Private
 */
router.put('/dm/:userId/read', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  await messageModel.markDMsAsRead(req.user.id, userId);
  
  res.json({
    success: true,
    data: { message: 'Messages marked as read' },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
