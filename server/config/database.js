const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./environment');

let db = null;

/**
 * Get database instance
 */
function getDatabase() {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dbDir = path.dirname(config.database.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(config.database.path, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

/**
 * Initialize database with all tables and indexes
 */
function initializeDatabase() {
  const database = getDatabase();

  return new Promise((resolve, reject) => {
    database.serialize(() => {
      // Users table
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          status TEXT DEFAULT 'online',
          custom_status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for users
      database.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      database.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

      // Servers table
      database.run(`
        CREATE TABLE IF NOT EXISTS servers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT,
          owner_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_servers_owner ON servers(owner_id)');

      // Server members table
      database.run(`
        CREATE TABLE IF NOT EXISTS server_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          server_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(server_id, user_id)
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_server_members_server ON server_members(server_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_server_members_user ON server_members(user_id)');

      // Channels table
      database.run(`
        CREATE TABLE IF NOT EXISTS channels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          server_id INTEGER NOT NULL,
          position INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_channels_server ON channels(server_id)');

      // Messages table
      database.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          channel_id INTEGER NOT NULL,
          edited BOOLEAN DEFAULT 0,
          edited_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)');

      // Direct messages table
      database.run(`
        CREATE TABLE IF NOT EXISTS direct_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          read BOOLEAN DEFAULT 0,
          edited BOOLEAN DEFAULT 0,
          edited_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at DESC)');

      // File uploads table
      database.run(`
        CREATE TABLE IF NOT EXISTS file_uploads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          filepath TEXT NOT NULL,
          filetype TEXT,
          filesize INTEGER,
          user_id INTEGER NOT NULL,
          channel_id INTEGER,
          message_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_files_user ON file_uploads(user_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_files_channel ON file_uploads(channel_id)');

      // Reactions table
      database.run(`
        CREATE TABLE IF NOT EXISTS reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          emoji TEXT NOT NULL,
          message_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(message_id, user_id, emoji)
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id)');

      // Friends table
      database.run(`
        CREATE TABLE IF NOT EXISTS friends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          friend_id INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, friend_id)
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id)');
      database.run('CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id)');

      // Roles table
      database.run(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          server_id INTEGER NOT NULL,
          permissions TEXT DEFAULT '{}',
          color TEXT,
          position INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_roles_server ON roles(server_id)');

      // Invites table
      database.run(`
        CREATE TABLE IF NOT EXISTS invites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          server_id INTEGER NOT NULL,
          inviter_id INTEGER NOT NULL,
          max_uses INTEGER DEFAULT 0,
          uses INTEGER DEFAULT 0,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
          FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      database.run('CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code)');
      database.run('CREATE INDEX IF NOT EXISTS idx_invites_server ON invites(server_id)');

      // Typing indicators table (temporary data)
      database.run(`
        CREATE TABLE IF NOT EXISTS typing_indicators (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          channel_id INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
        )
      `);

      console.log('✅ Database initialized with all tables and indexes');
      resolve();
    });
  });
}

/**
 * Database wrapper with promisified methods
 */
class DatabaseWrapper {
  constructor(database) {
    this.db = database;
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Initialize database if run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = {
  getDatabase,
  initializeDatabase,
  DatabaseWrapper
};
