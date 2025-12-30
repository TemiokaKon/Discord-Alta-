/**
 * WebSocket Client Module
 * Handles all real-time communication via Socket.IO
 */

const WebSocketClient = {
  socket: null,
  connected: false,
  listeners: new Map(),

  /**
   * Initialize WebSocket connection
   */
  init(token) {
    if (typeof io === 'undefined') {
      console.error('Socket.IO not loaded');
      return;
    }

    this.socket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  },

  /**
   * Setup core event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Connected to WebSocket');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('❌ Disconnected from WebSocket');
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    // Message events
    this.socket.on('new-message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('new-dm', (data) => {
      this.emit('dm', data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      this.emit('typing-start', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('typing-stop', data);
    });

    // User status
    this.socket.on('user-status', (data) => {
      this.emit('user-status', data);
    });

    // Reactions
    this.socket.on('reaction-added', (data) => {
      this.emit('reaction-add', data);
    });

    this.socket.on('reaction-removed', (data) => {
      this.emit('reaction-remove', data);
    });

    // WebRTC call events
    this.socket.on('incoming-call', (data) => {
      this.emit('call-incoming', data);
    });

    this.socket.on('call-answered', (data) => {
      this.emit('call-answered', data);
    });

    this.socket.on('ice-candidate', (data) => {
      this.emit('ice-candidate', data);
    });

    this.socket.on('call-ended', (data) => {
      this.emit('call-ended', data);
    });
  },

  /**
   * Join a server room
   */
  joinServer(serverId) {
    if (this.connected) {
      this.socket.emit('join-server', serverId);
    }
  },

  /**
   * Leave a server room
   */
  leaveServer(serverId) {
    if (this.connected) {
      this.socket.emit('leave-server', serverId);
    }
  },

  /**
   * Join a channel room
   */
  joinChannel(channelId) {
    if (this.connected) {
      this.socket.emit('join-channel', channelId);
    }
  },

  /**
   * Leave a channel room
   */
  leaveChannel(channelId) {
    if (this.connected) {
      this.socket.emit('leave-channel', channelId);
    }
  },

  /**
   * Send a message
   */
  sendMessage(channelId, content, username, avatar) {
    if (this.connected) {
      this.socket.emit('send-message', {
        channelId,
        content,
        username,
        avatar
      });
    }
  },

  /**
   * Send a direct message
   */
  sendDM(receiverId, content) {
    if (this.connected) {
      this.socket.emit('send-dm', {
        receiverId,
        content
      });
    }
  },

  /**
   * Start typing indicator
   */
  startTyping(channelId) {
    if (this.connected) {
      this.socket.emit('typing-start', { channelId });
    }
  },

  /**
   * Stop typing indicator
   */
  stopTyping(channelId) {
    if (this.connected) {
      this.socket.emit('typing-stop', { channelId });
    }
  },

  /**
   * Update user status
   */
  updateStatus(status) {
    if (this.connected) {
      this.socket.emit('update-status', status);
    }
  },

  /**
   * Add reaction
   */
  addReaction(messageId, emoji, channelId) {
    if (this.connected) {
      this.socket.emit('add-reaction', {
        messageId,
        emoji,
        channelId
      });
    }
  },

  /**
   * Remove reaction
   */
  removeReaction(messageId, emoji, channelId) {
    if (this.connected) {
      this.socket.emit('remove-reaction', {
        messageId,
        emoji,
        channelId
      });
    }
  },

  /**
   * WebRTC call methods
   */
  callUser(targetUserId, offer, callType = 'voice') {
    if (this.connected) {
      this.socket.emit('call-user', {
        targetUserId,
        offer,
        callType
      });
    }
  },

  answerCall(targetUserId, answer) {
    if (this.connected) {
      this.socket.emit('call-answer', {
        targetUserId,
        answer
      });
    }
  },

  sendIceCandidate(targetUserId, candidate) {
    if (this.connected) {
      this.socket.emit('ice-candidate', {
        targetUserId,
        candidate
      });
    }
  },

  endCall(targetUserId) {
    if (this.connected) {
      this.socket.emit('end-call', {
        targetUserId
      });
    }
  },

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  },

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  },

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  },

  /**
   * Disconnect
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
};
