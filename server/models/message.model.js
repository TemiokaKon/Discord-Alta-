const { getDatabase, DatabaseWrapper } = require('../config/database');

/**
 * Message Model
 * Handles all message-related database operations
 */
class MessageModel {
  constructor() {
    this.db = new DatabaseWrapper(getDatabase());
  }

  /**
   * Create a new message
   */
  async create(content, userId, channelId) {
    const result = await this.db.run(
      'INSERT INTO messages (content, user_id, channel_id) VALUES (?, ?, ?)',
      [content, userId, channelId]
    );
    return result.lastID;
  }

  /**
   * Find message by ID
   */
  async findById(id) {
    return await this.db.get(
      `SELECT m.*, u.username, u.avatar 
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [id]
    );
  }

  /**
   * Get messages for channel (with pagination)
   */
  async getByChannel(channelId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const messages = await this.db.all(
      `SELECT m.*, u.username, u.avatar 
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.channel_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [channelId, limit, offset]
    );

    const total = await this.db.get(
      'SELECT COUNT(*) as count FROM messages WHERE channel_id = ?',
      [channelId]
    );

    return {
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  /**
   * Update message
   */
  async update(id, content) {
    await this.db.run(
      'UPDATE messages SET content = ?, edited = 1, edited_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id]
    );
  }

  /**
   * Delete message
   */
  async delete(id) {
    await this.db.run('DELETE FROM messages WHERE id = ?', [id]);
  }

  /**
   * Search messages in channel
   */
  async search(channelId, query, limit = 50) {
    return await this.db.all(
      `SELECT m.*, u.username, u.avatar 
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.channel_id = ? AND m.content LIKE ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [channelId, `%${query}%`, limit]
    );
  }

  /**
   * Get message reactions
   */
  async getReactions(messageId) {
    return await this.db.all(
      `SELECT r.*, u.username 
       FROM reactions r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.message_id = ?
       ORDER BY r.created_at ASC`,
      [messageId]
    );
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, emoji) {
    try {
      await this.db.run(
        'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
        [messageId, userId, emoji]
      );
      return true;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return false; // Already reacted
      }
      throw err;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId, emoji) {
    await this.db.run(
      'DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, userId, emoji]
    );
  }

  /**
   * Create direct message
   */
  async createDM(content, senderId, receiverId) {
    const result = await this.db.run(
      'INSERT INTO direct_messages (content, sender_id, receiver_id) VALUES (?, ?, ?)',
      [content, senderId, receiverId]
    );
    return result.lastID;
  }

  /**
   * Get direct messages between users
   */
  async getDMs(userId1, userId2, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const messages = await this.db.all(
      `SELECT dm.*, u.username as sender_username, u.avatar as sender_avatar
       FROM direct_messages dm
       INNER JOIN users u ON dm.sender_id = u.id
       WHERE (dm.sender_id = ? AND dm.receiver_id = ?) 
          OR (dm.sender_id = ? AND dm.receiver_id = ?)
       ORDER BY dm.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId1, userId2, userId2, userId1, limit, offset]
    );

    const total = await this.db.get(
      `SELECT COUNT(*) as count FROM direct_messages
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)`,
      [userId1, userId2, userId2, userId1]
    );

    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  /**
   * Mark DMs as read
   */
  async markDMsAsRead(receiverId, senderId) {
    await this.db.run(
      'UPDATE direct_messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?',
      [receiverId, senderId]
    );
  }
}

module.exports = new MessageModel();
