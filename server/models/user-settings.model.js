const { getDatabase, DatabaseWrapper } = require('../config/database');

/**
 * UserSettings Model
 * Handles user settings storage and retrieval
 */
class UserSettingsModel {
  constructor() {
    this.db = new DatabaseWrapper(getDatabase());
  }

  /**
   * Get user settings by user ID
   * @param {number} userId - User ID
   * @returns {Object} User settings object
   */
  async get(userId) {
    const row = await this.db.get(
      'SELECT settings, updated_at FROM user_settings WHERE user_id = ?',
      [userId]
    );
    
    if (!row) {
      // Return default settings if none exist
      return this.getDefaultSettings();
    }
    
    try {
      return {
        ...JSON.parse(row.settings),
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Error parsing user settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save or update user settings
   * @param {number} userId - User ID
   * @param {Object} settings - Settings object
   */
  async save(userId, settings) {
    const settingsJson = JSON.stringify(settings);
    
    // Try to update first
    const result = await this.db.run(
      'UPDATE user_settings SET settings = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [settingsJson, userId]
    );
    
    // If no rows affected, insert new record
    if (result.changes === 0) {
      await this.db.run(
        'INSERT INTO user_settings (user_id, settings) VALUES (?, ?)',
        [userId, settingsJson]
      );
    }
    
    return true;
  }

  /**
   * Delete user settings
   * @param {number} userId - User ID
   */
  async delete(userId) {
    await this.db.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    return true;
  }

  /**
   * Get default settings structure
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      voice: {
        inputDevice: 'default',
        outputDevice: 'default',
        inputVolume: 100,
        outputVolume: 100,
        inputGain: 100,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        micMonitor: false,
        micMonitorVolume: 20
      },
      video: {
        device: 'default',
        quality: '720p'
      },
      screen: {
        quality: '1080p',
        includeAudio: false
      },
      notifications: {
        soundEnabled: true,
        messageSound: true,
        callSound: true,
        joinSound: true,
        leaveSound: true
      }
    };
  }
}

module.exports = new UserSettingsModel();
