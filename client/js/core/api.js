/**
 * API Client Module
 * Handles all HTTP requests to the backend API
 */

const API = {
  baseURL: '/api/v1',
  token: null,

  /**
   * Initialize API with token from localStorage
   */
  init() {
    this.token = localStorage.getItem('token');
  },

  /**
   * Get headers for requests
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  },

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.auth !== false),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  /**
   * Authentication
   */
  auth: {
    async register(username, email, password) {
      const data = await API.request('/auth/register', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ username, email, password })
      });

      if (data.success) {
        API.token = data.data.token;
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }

      return data;
    },

    async login(email, password) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password })
      });

      if (data.success) {
        API.token = data.data.token;
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }

      return data;
    },

    async verify() {
      return await API.request('/auth/verify');
    },

    logout() {
      API.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login.html';
    }
  },

  /**
   * Users
   */
  users: {
    async getMe() {
      return await API.request('/users/me');
    },

    async updateMe(updates) {
      return await API.request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async getById(id) {
      return await API.request(`/users/${id}`);
    },

    async getAll(page = 1, limit = 50) {
      return await API.request(`/users?page=${page}&limit=${limit}`);
    },

    async search(query) {
      return await API.request(`/users/search/${query}`);
    },

    async updateStatus(status) {
      return await API.request('/users/me/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    }
  },

  /**
   * Servers
   */
  servers: {
    async create(name, icon = null) {
      return await API.request('/servers', {
        method: 'POST',
        body: JSON.stringify({ name, icon })
      });
    },

    async getAll() {
      return await API.request('/servers');
    },

    async getById(id) {
      return await API.request(`/servers/${id}`);
    },

    async update(id, updates) {
      return await API.request(`/servers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async delete(id) {
      return await API.request(`/servers/${id}`, {
        method: 'DELETE'
      });
    },

    async getMembers(id) {
      return await API.request(`/servers/${id}/members`);
    },

    async addMember(serverId, userId) {
      return await API.request(`/servers/${serverId}/members/${userId}`, {
        method: 'POST'
      });
    },

    async removeMember(serverId, userId) {
      return await API.request(`/servers/${serverId}/members/${userId}`, {
        method: 'DELETE'
      });
    },

    async createChannel(serverId, name, type) {
      return await API.request(`/servers/${serverId}/channels`, {
        method: 'POST',
        body: JSON.stringify({ name, type, serverId })
      });
    },

    async deleteChannel(serverId, channelId) {
      return await API.request(`/servers/${serverId}/channels/${channelId}`, {
        method: 'DELETE'
      });
    }
  },

  /**
   * Messages
   */
  messages: {
    async getByChannel(channelId, page = 1, limit = 50) {
      return await API.request(`/messages/channel/${channelId}?page=${page}&limit=${limit}`);
    },

    async send(channelId, content) {
      return await API.request(`/messages/channel/${channelId}`, {
        method: 'POST',
        body: JSON.stringify({ content, channelId })
      });
    },

    async edit(messageId, content) {
      return await API.request(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
    },

    async delete(messageId) {
      return await API.request(`/messages/${messageId}`, {
        method: 'DELETE'
      });
    },

    async addReaction(messageId, emoji) {
      return await API.request(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
    },

    async removeReaction(messageId, emoji) {
      return await API.request(`/messages/${messageId}/reactions/${emoji}`, {
        method: 'DELETE'
      });
    },

    async search(channelId, query) {
      return await API.request(`/messages/search/${channelId}?q=${encodeURIComponent(query)}`);
    },

    async getDMs(userId, page = 1, limit = 50) {
      return await API.request(`/messages/dm/${userId}?page=${page}&limit=${limit}`);
    },

    async sendDM(userId, content) {
      return await API.request(`/messages/dm/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    },

    async markDMsAsRead(userId) {
      return await API.request(`/messages/dm/${userId}/read`, {
        method: 'PUT'
      });
    }
  },

  /**
   * Friends
   */
  friends: {
    async getAll() {
      return await API.request('/friends');
    },

    async getPending() {
      return await API.request('/friends/pending');
    },

    async getSent() {
      return await API.request('/friends/sent');
    },

    async send(userId) {
      return await API.request(`/friends/${userId}`, {
        method: 'POST'
      });
    },

    async accept(userId) {
      return await API.request(`/friends/${userId}/accept`, {
        method: 'PUT'
      });
    },

    async remove(userId) {
      return await API.request(`/friends/${userId}`, {
        method: 'DELETE'
      });
    },

    async getStatus(userId) {
      return await API.request(`/friends/${userId}/status`);
    }
  },

  /**
   * File upload
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data;
  }
};

// Initialize API
API.init();
