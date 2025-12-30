const { getDatabase, DatabaseWrapper } = require('../config/database');

/**
 * Server Model
 * Handles all server-related database operations
 */
class ServerModel {
  constructor() {
    this.db = new DatabaseWrapper(getDatabase());
  }

  /**
   * Create a new server
   */
  async create(name, ownerId, icon = null) {
    const result = await this.db.run(
      'INSERT INTO servers (name, owner_id, icon) VALUES (?, ?, ?)',
      [name, ownerId, icon]
    );
    return result.lastID;
  }

  /**
   * Find server by ID
   */
  async findById(id) {
    return await this.db.get(
      'SELECT * FROM servers WHERE id = ?',
      [id]
    );
  }

  /**
   * Update server
   */
  async update(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (['name', 'icon'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await this.db.run(
      `UPDATE servers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return true;
  }

  /**
   * Delete server
   */
  async delete(id) {
    await this.db.run('DELETE FROM servers WHERE id = ?', [id]);
  }

  /**
   * Get user's servers
   */
  async getUserServers(userId) {
    return await this.db.all(
      `SELECT s.* FROM servers s
       LEFT JOIN server_members sm ON s.id = sm.server_id
       WHERE s.owner_id = ? OR sm.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [userId, userId]
    );
  }

  /**
   * Add member to server
   */
  async addMember(serverId, userId, role = 'member') {
    try {
      await this.db.run(
        'INSERT INTO server_members (server_id, user_id, role) VALUES (?, ?, ?)',
        [serverId, userId, role]
      );
      return true;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return false; // Already a member
      }
      throw err;
    }
  }

  /**
   * Remove member from server
   */
  async removeMember(serverId, userId) {
    await this.db.run(
      'DELETE FROM server_members WHERE server_id = ? AND user_id = ?',
      [serverId, userId]
    );
  }

  /**
   * Get server members
   */
  async getMembers(serverId) {
    return await this.db.all(
      `SELECT u.id, u.username, u.avatar, u.status, sm.role, sm.joined_at
       FROM users u
       INNER JOIN server_members sm ON u.id = sm.user_id
       WHERE sm.server_id = ?
       ORDER BY sm.joined_at ASC`,
      [serverId]
    );
  }

  /**
   * Check if user is member
   */
  async isMember(serverId, userId) {
    const result = await this.db.get(
      `SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?
       UNION
       SELECT 1 FROM servers WHERE id = ? AND owner_id = ?`,
      [serverId, userId, serverId, userId]
    );
    return !!result;
  }

  /**
   * Check if user is owner
   */
  async isOwner(serverId, userId) {
    const server = await this.findById(serverId);
    return server && server.owner_id === userId;
  }

  /**
   * Get server with channels
   */
  async getWithChannels(serverId) {
    const server = await this.findById(serverId);
    if (!server) return null;

    const channels = await this.db.all(
      'SELECT * FROM channels WHERE server_id = ? ORDER BY position, created_at',
      [serverId]
    );

    return {
      ...server,
      channels
    };
  }
}

module.exports = new ServerModel();
