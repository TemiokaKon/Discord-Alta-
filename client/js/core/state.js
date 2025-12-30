/**
 * State Management Module
 * Centralized application state with reactive updates
 */

const AppState = {
  // State
  state: {
    currentUser: null,
    currentView: 'friends', // 'friends' | 'server' | 'dm'
    currentServer: null,
    currentChannel: null,
    currentDMUser: null,
    
    servers: [],
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    
    messages: {},  // { channelId: [messages] }
    dmMessages: {}, // { userId: [messages] }
    
    onlineUsers: new Set(),
    typingUsers: new Map(), // { channelId: Set(userIds) }
    
    inCall: false,
    callUser: null,
    callType: null,
    
    settings: {
      theme: 'dark',
      notifications: true,
      sounds: true
    }
  },

  // Subscribers
  subscribers: new Map(),

  /**
   * Initialize state from localStorage
   */
  init() {
    // Load user
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.state.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Load settings
    const settingsStr = localStorage.getItem('settings');
    if (settingsStr) {
      try {
        this.state.settings = { ...this.state.settings, ...JSON.parse(settingsStr) };
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  },

  /**
   * Get state value
   */
  get(key) {
    return this.state[key];
  },

  /**
   * Set state value and notify subscribers
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Save to localStorage for persistence
    if (key === 'currentUser') {
      localStorage.setItem('currentUser', JSON.stringify(value));
    } else if (key === 'settings') {
      localStorage.setItem('settings', JSON.stringify(value));
    }
    
    this.notify(key, value, oldValue);
  },

  /**
   * Update nested state (merge objects)
   */
  update(key, updates) {
    if (typeof this.state[key] === 'object' && !Array.isArray(this.state[key])) {
      this.set(key, { ...this.state[key], ...updates });
    } else {
      this.set(key, updates);
    }
  },

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  },

  /**
   * Notify subscribers of state change
   */
  notify(key, newValue, oldValue) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in ${key} subscriber:`, error);
        }
      });
    }
  },

  /**
   * User methods
   */
  user: {
    setCurrentUser(user) {
      AppState.set('currentUser', user);
    },

    updateCurrentUser(updates) {
      AppState.update('currentUser', updates);
    },

    getCurrentUser() {
      return AppState.get('currentUser');
    }
  },

  /**
   * Server methods
   */
  servers: {
    setAll(servers) {
      AppState.set('servers', servers);
    },

    add(server) {
      const servers = AppState.get('servers');
      AppState.set('servers', [...servers, server]);
    },

    update(serverId, updates) {
      const servers = AppState.get('servers');
      AppState.set('servers', servers.map(s => 
        s.id === serverId ? { ...s, ...updates } : s
      ));
    },

    remove(serverId) {
      const servers = AppState.get('servers');
      AppState.set('servers', servers.filter(s => s.id !== serverId));
    },

    setCurrent(server) {
      AppState.set('currentServer', server);
      AppState.set('currentView', 'server');
    }
  },

  /**
   * Channel methods
   */
  channels: {
    setCurrent(channel) {
      AppState.set('currentChannel', channel);
    }
  },

  /**
   * Message methods
   */
  messages: {
    setForChannel(channelId, messages) {
      const allMessages = AppState.get('messages');
      AppState.set('messages', {
        ...allMessages,
        [channelId]: messages
      });
    },

    addToChannel(channelId, message) {
      const allMessages = AppState.get('messages');
      const channelMessages = allMessages[channelId] || [];
      AppState.set('messages', {
        ...allMessages,
        [channelId]: [...channelMessages, message]
      });
    },

    updateInChannel(channelId, messageId, updates) {
      const allMessages = AppState.get('messages');
      const channelMessages = allMessages[channelId] || [];
      AppState.set('messages', {
        ...allMessages,
        [channelId]: channelMessages.map(m =>
          m.id === messageId ? { ...m, ...updates } : m
        )
      });
    },

    removeFromChannel(channelId, messageId) {
      const allMessages = AppState.get('messages');
      const channelMessages = allMessages[channelId] || [];
      AppState.set('messages', {
        ...allMessages,
        [channelId]: channelMessages.filter(m => m.id !== messageId)
      });
    },

    getForChannel(channelId) {
      const allMessages = AppState.get('messages');
      return allMessages[channelId] || [];
    }
  },

  /**
   * DM methods
   */
  dms: {
    setForUser(userId, messages) {
      const allDMs = AppState.get('dmMessages');
      AppState.set('dmMessages', {
        ...allDMs,
        [userId]: messages
      });
    },

    addForUser(userId, message) {
      const allDMs = AppState.get('dmMessages');
      const userMessages = allDMs[userId] || [];
      AppState.set('dmMessages', {
        ...allDMs,
        [userId]: [...userMessages, message]
      });
    },

    getForUser(userId) {
      const allDMs = AppState.get('dmMessages');
      return allDMs[userId] || [];
    }
  },

  /**
   * Friends methods
   */
  friends: {
    setAll(friends) {
      AppState.set('friends', friends);
    },

    setPending(requests) {
      AppState.set('pendingRequests', requests);
    },

    setSent(requests) {
      AppState.set('sentRequests', requests);
    },

    add(friend) {
      const friends = AppState.get('friends');
      AppState.set('friends', [...friends, friend]);
    },

    remove(friendId) {
      const friends = AppState.get('friends');
      AppState.set('friends', friends.filter(f => f.id !== friendId));
    }
  },

  /**
   * Online status methods
   */
  online: {
    setUserOnline(userId) {
      const users = AppState.get('onlineUsers');
      users.add(userId);
      AppState.set('onlineUsers', new Set(users));
    },

    setUserOffline(userId) {
      const users = AppState.get('onlineUsers');
      users.delete(userId);
      AppState.set('onlineUsers', new Set(users));
    },

    isOnline(userId) {
      return AppState.get('onlineUsers').has(userId);
    }
  },

  /**
   * Typing indicators
   */
  typing: {
    startTyping(channelId, userId) {
      const typingUsers = AppState.get('typingUsers');
      if (!typingUsers.has(channelId)) {
        typingUsers.set(channelId, new Set());
      }
      typingUsers.get(channelId).add(userId);
      AppState.set('typingUsers', new Map(typingUsers));
    },

    stopTyping(channelId, userId) {
      const typingUsers = AppState.get('typingUsers');
      if (typingUsers.has(channelId)) {
        typingUsers.get(channelId).delete(userId);
        AppState.set('typingUsers', new Map(typingUsers));
      }
    },

    getTypingUsers(channelId) {
      const typingUsers = AppState.get('typingUsers');
      return typingUsers.get(channelId) || new Set();
    }
  },

  /**
   * View methods
   */
  view: {
    showFriends() {
      AppState.set('currentView', 'friends');
      AppState.set('currentServer', null);
      AppState.set('currentChannel', null);
    },

    showServer(server, channel = null) {
      AppState.set('currentView', 'server');
      AppState.set('currentServer', server);
      AppState.set('currentChannel', channel);
    },

    showDM(user) {
      AppState.set('currentView', 'dm');
      AppState.set('currentDMUser', user);
    }
  },

  /**
   * Settings methods
   */
  settings: {
    update(updates) {
      AppState.update('settings', updates);
    },

    get(key) {
      return AppState.get('settings')[key];
    }
  }
};

// Initialize state
AppState.init();
