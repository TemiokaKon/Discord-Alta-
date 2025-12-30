const express = require('express');
const router = express.Router();
const serverModel = require('../models/server.model');
const { getDatabase, DatabaseWrapper } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticateToken);

const db = new DatabaseWrapper(getDatabase());

/**
 * @route   POST /api/v1/servers
 * @desc    Create a new server
 * @access  Private
 */
router.post('/', validate(schemas.createServer), asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  // Note: description is accepted but not stored (database doesn't have this field yet)
  
  const serverId = await serverModel.create(name, req.user.id, icon);
  
  // Create default text channel
  await db.run(
    'INSERT INTO channels (name, type, server_id, position) VALUES (?, ?, ?, ?)',
    ['general', 'text', serverId, 0]
  );
  
  // Create default voice channel
  await db.run(
    'INSERT INTO channels (name, type, server_id, position) VALUES (?, ?, ?, ?)',
    ['General Voice', 'voice', serverId, 1]
  );
  
  const server = await serverModel.getWithChannels(serverId);
  
  res.status(201).json({
    success: true,
    data: { server },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/servers
 * @desc    Get user's servers
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const servers = await serverModel.getUserServers(req.user.id);
  
  res.json({
    success: true,
    data: { servers },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/servers/:id
 * @desc    Get server by ID
 * @access  Private
 */
router.get('/:id', validate(schemas.id, 'params'), asyncHandler(async (req, res) => {
  const serverId = req.params.id;
  
  // Check if user is member
  const isMember = await serverModel.isMember(serverId, req.user.id);
  if (!isMember) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const server = await serverModel.getWithChannels(serverId);
  
  if (!server) {
    throw createError('Server not found', 404, 'SERVER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: { server },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/v1/servers/:id
 * @desc    Update server
 * @access  Private
 */
router.put('/:id', validate(schemas.id, 'params'), validate(schemas.updateServer), asyncHandler(async (req, res) => {
  const serverId = req.params.id;
  
  // Check if user is owner
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner) {
    throw createError('Only server owner can update server', 403, 'OWNER_ONLY');
  }
  
  await serverModel.update(serverId, req.body);
  const server = await serverModel.findById(serverId);
  
  res.json({
    success: true,
    data: { server },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/servers/:id
 * @desc    Delete server
 * @access  Private
 */
router.delete('/:id', validate(schemas.id, 'params'), asyncHandler(async (req, res) => {
  const serverId = req.params.id;
  
  // Check if user is owner
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner) {
    throw createError('Only server owner can delete server', 403, 'OWNER_ONLY');
  }
  
  await serverModel.delete(serverId);
  
  res.json({
    success: true,
    data: { message: 'Server deleted successfully' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/v1/servers/:id/members
 * @desc    Get server members
 * @access  Private
 */
router.get('/:id/members', validate(schemas.id, 'params'), asyncHandler(async (req, res) => {
  const serverId = req.params.id;
  
  // Check if user is member
  const isMember = await serverModel.isMember(serverId, req.user.id);
  if (!isMember) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const members = await serverModel.getMembers(serverId);
  
  res.json({
    success: true,
    data: { members },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/servers/:id/members/:userId
 * @desc    Add member to server
 * @access  Private
 */
router.post('/:id/members/:userId', asyncHandler(async (req, res) => {
  const { id: serverId, userId } = req.params;
  
  // Check if user is owner or admin
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner && req.user.id !== parseInt(userId)) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const added = await serverModel.addMember(serverId, userId);
  
  if (!added) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ALREADY_MEMBER',
        message: 'User is already a member',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  res.status(201).json({
    success: true,
    data: { message: 'Member added successfully' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/servers/:id/members/:userId
 * @desc    Remove member from server
 * @access  Private
 */
router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  const { id: serverId, userId } = req.params;
  
  // Check if user is owner or removing themselves
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner && req.user.id !== parseInt(userId)) {
    throw createError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  await serverModel.removeMember(serverId, userId);
  
  res.json({
    success: true,
    data: { message: 'Member removed successfully' },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/v1/servers/:id/channels
 * @desc    Create channel in server
 * @access  Private
 */
router.post('/:id/channels', validate(schemas.createChannel), asyncHandler(async (req, res) => {
  const serverId = req.params.id;
  const { name, type } = req.body;
  
  // Check if user is owner
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner) {
    throw createError('Only server owner can create channels', 403, 'OWNER_ONLY');
  }
  
  const result = await db.run(
    'INSERT INTO channels (name, type, server_id) VALUES (?, ?, ?)',
    [name, type, serverId]
  );
  
  const channel = await db.get('SELECT * FROM channels WHERE id = ?', [result.lastID]);
  
  res.status(201).json({
    success: true,
    data: { channel },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/v1/servers/:serverId/channels/:channelId
 * @desc    Delete channel from server
 * @access  Private
 */
router.delete('/:serverId/channels/:channelId', asyncHandler(async (req, res) => {
  const { serverId, channelId } = req.params;
  
  // Check if user is owner
  const isOwner = await serverModel.isOwner(serverId, req.user.id);
  if (!isOwner) {
    throw createError('Only server owner can delete channels', 403, 'OWNER_ONLY');
  }
  
  await db.run('DELETE FROM channels WHERE id = ? AND server_id = ?', [channelId, serverId]);
  
  res.json({
    success: true,
    data: { message: 'Channel deleted successfully' },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
