const http = require('http');
const socketIO = require('socket.io');
const { createApp } = require('./app');
const config = require('./config/environment');
const { logger } = require('./config/logger');
const { socketAuth } = require('./middleware/auth.middleware');
const messageModel = require('./models/message.model');

/**
 * Initialize Socket.IO with WebSocket service
 */
function initializeSocketIO(server) {
  const io = socketIO(server, {
    cors: {
      origin: config.isProduction 
        ? [config.baseUrl, `https://${config.server.domain}`]
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket authentication
  io.use(socketAuth);

  // Track online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info('User connected via WebSocket', { userId, socketId: socket.id });

    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online status
    io.emit('user-status', { userId, status: 'online' });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining server/channel rooms
    socket.on('join-server', (serverId) => {
      socket.join(`server:${serverId}`);
      logger.info('User joined server', { userId, serverId });
    });

    socket.on('leave-server', (serverId) => {
      socket.leave(`server:${serverId}`);
      logger.info('User left server', { userId, serverId });
    });

    socket.on('join-channel', (channelId) => {
      socket.join(`channel:${channelId}`);
      logger.info('User joined channel', { userId, channelId });
    });

    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
      logger.info('User left channel', { userId, channelId });
    });

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { channelId, content } = data;
        
        // Persist message to database
        const messageId = await messageModel.create(content, userId, channelId);
        const message = await messageModel.findById(messageId);
        
        // Emit to channel subscribers
        io.to(`channel:${channelId}`).emit('new-message', { message, channelId });
        logger.info('Message sent and persisted', { userId, channelId, messageId });
      } catch (error) {
        logger.error('Error sending message', { error: error.message, userId });
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle direct messages
    socket.on('send-dm', async (data) => {
      try {
        const { receiverId, content } = data;
        const receiverSocketId = onlineUsers.get(parseInt(receiverId));
        
        // Persist DM to database
        const messageId = await messageModel.createDM(content, userId, receiverId);
        
        // Emit to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new-dm', {
            id: messageId,
            senderId: userId,
            senderUsername: socket.user.username,
            senderAvatar: socket.user.avatar,
            content,
            created_at: new Date().toISOString()
          });
        }
        
        // Emit confirmation to sender
        socket.emit('dm-sent', { messageId, receiverId });
        
        logger.info('DM sent and persisted', { senderId: userId, receiverId, messageId });
      } catch (error) {
        logger.error('Error sending DM', { error: error.message, userId });
        socket.emit('dm-error', { error: 'Failed to send direct message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('user-typing', {
        userId,
        username: socket.user.username,
        channelId
      });
    });

    socket.on('typing-stop', (data) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('user-stopped-typing', {
        userId,
        channelId
      });
    });

    // Handle WebRTC signaling
    socket.on('call-user', (data) => {
      const { targetUserId, offer, callType } = data;
      const targetSocketId = onlineUsers.get(parseInt(targetUserId));
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming-call', {
          callerId: userId,
          callerUsername: socket.user.username,
          offer,
          callType
        });
      }
    });

    socket.on('call-answer', (data) => {
      const { targetUserId, answer } = data;
      const targetSocketId = onlineUsers.get(parseInt(targetUserId));
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-answered', {
          userId,
          answer
        });
      }
    });

    socket.on('ice-candidate', (data) => {
      const { targetUserId, candidate } = data;
      const targetSocketId = onlineUsers.get(parseInt(targetUserId));
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', {
          userId,
          candidate
        });
      }
    });

    socket.on('end-call', (data) => {
      const { targetUserId } = data;
      const targetSocketId = onlineUsers.get(parseInt(targetUserId));
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-ended', { userId });
      }
    });

    // Handle reactions
    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, emoji, channelId } = data;
        
        // Persist reaction to database
        const added = await messageModel.addReaction(messageId, userId, emoji);
        
        if (added) {
          const reactions = await messageModel.getReactions(messageId);
          
          // Emit to channel subscribers
          io.to(`channel:${channelId}`).emit('reaction-added', {
            messageId,
            emoji,
            userId,
            username: socket.user.username,
            reactions
          });
          logger.info('Reaction added', { userId, messageId, emoji });
        } else {
          socket.emit('reaction-error', { error: 'Already reacted with this emoji' });
        }
      } catch (error) {
        logger.error('Error adding reaction', { error: error.message, userId });
        socket.emit('reaction-error', { error: 'Failed to add reaction' });
      }
    });

    socket.on('remove-reaction', async (data) => {
      try {
        const { messageId, emoji, channelId } = data;
        
        // Remove reaction from database
        await messageModel.removeReaction(messageId, userId, emoji);
        const reactions = await messageModel.getReactions(messageId);
        
        // Emit to channel subscribers
        io.to(`channel:${channelId}`).emit('reaction-removed', {
          messageId,
          emoji,
          userId,
          reactions
        });
        logger.info('Reaction removed', { userId, messageId, emoji });
      } catch (error) {
        logger.error('Error removing reaction', { error: error.message, userId });
        socket.emit('reaction-error', { error: 'Failed to remove reaction' });
      }
    });

    // Handle user status updates
    socket.on('update-status', (status) => {
      io.emit('user-status', { userId, status });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user-status', { userId, status: 'offline' });
      logger.info('User disconnected', { userId, socketId: socket.id });
    });
  });

  return io;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    const app = await createApp();
    const server = http.createServer(app);
    const io = initializeSocketIO(server);

    // Make io available to routes
    app.set('io', io);

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

    // Start listening
    server.listen(config.server.port, config.server.host, () => {
      logger.info('🚀 Alta52 v3.0 Server Started', {
        environment: config.server.env,
        port: config.server.port,
        host: config.server.host,
        url: config.isDevelopment ? `http://localhost:${config.server.port}` : config.baseUrl
      });

      if (config.isDevelopment) {
        console.log('\n' + '='.repeat(50));
        console.log('🌟 Alta52 v3.0 - Ruby Discord Clone');
        console.log('='.repeat(50));
        console.log(`📍 Server: http://localhost:${config.server.port}`);
        console.log(`📡 API: http://localhost:${config.server.port}/api/v1`);
        console.log(`💎 Environment: ${config.server.env}`);
        console.log('='.repeat(50) + '\n');
      }
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start server
startServer();
