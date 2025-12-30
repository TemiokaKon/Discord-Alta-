module.exports = {
  apps: [{
    name: 'alta52',
    script: './server/server.js',
    instances: 1,              // Only 1 instance
    exec_mode: 'fork',         // NOT cluster
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_DIR: process.env.LOG_DIR || './logs',
      DB_PATH: process.env.DB_PATH || './data/alta-base.db'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      LOG_DIR: process.env.LOG_DIR || '/var/log/alta52',
      DB_PATH: process.env.DB_PATH || '/var/lib/alta52/alta52.db',
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      CORS_ORIGINS: process.env.CORS_ORIGINS
    },
    error_file: process.env.LOG_DIR ? `${process.env.LOG_DIR}/pm2-error.log` : './logs/pm2-error.log',
    out_file: process.env.LOG_DIR ? `${process.env.LOG_DIR}/pm2-out.log` : './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000
  }]
};
