const { getDatabase, DatabaseWrapper } = require('../config/database');

/**
 * User Model
 * Handles all user-related database operations
 */
class UserModel {
  constructor() {
    this.db = new DatabaseWrapper(getDatabase());
  }

  /**
   * Create a new user
   */
  async create(userData) {
    const { username, email, password, avatar } = userData;
    const result = await this.db.run(
      'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
      [username, email, password, avatar || null]
    );
    return result.lastID;
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    return await this.db.get(
      'SELECT id, username, email, avatar, status, custom_status, created_at FROM users WHERE id = ?',
      [id]
    );
  }

  /**
   * Find user by ID with password (for authentication)
   */
  async findByIdWithPassword(id) {
    return await this.db.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await this.db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  /**
   * Update user
   */
  async update(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (['username', 'email', 'avatar', 'status', 'custom_status'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    await this.db.run(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return true;
  }

  /**
   * Update password
   */
  async updatePassword(id, hashedPassword) {
    await this.db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
  }

  /**
   * Delete user
   */
  async delete(id) {
    await this.db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  /**
   * Search users
   */
  async search(query, limit = 20) {
    return await this.db.all(
      `SELECT id, username, email, avatar, status FROM users 
       WHERE username LIKE ? OR email LIKE ? 
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    );
  }

  /**
   * Get all users (with pagination)
   */
  async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const users = await this.db.all(
      `SELECT id, username, email, avatar, status, custom_status, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = await this.db.get('SELECT COUNT(*) as count FROM users');
    
    return {
      users,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  /**
   * Update user status
   */
  async updateStatus(id, status) {
    await this.db.run(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  }
}

module.exports = new UserModel();
