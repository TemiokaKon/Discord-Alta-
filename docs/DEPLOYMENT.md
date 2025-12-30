# Alta52 Deployment Guide

## Production Deployment

### Prerequisites

- Node.js >= 14.0.0
- PM2 process manager
- Nginx (recommended for reverse proxy)
- SSL certificate (for HTTPS)

### Environment Variables

The following environment variables **must** be set in production:

#### Required

- `NODE_ENV=production`
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `SESSION_SECRET` - Session secret (minimum 32 characters)
- `DB_PATH` - Database file path (recommended: `/var/lib/alta52/alta52.db`)

#### Optional

- `PORT` - Server port (default: 3000)
- `LOG_DIR` - Log directory (default: `/var/log/alta52`)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (e.g., `https://dis-alta.ru,https://www.dis-alta.ru`)
- `UPLOAD_PATH` - Upload directory (default: `./uploads`)
- `UPLOAD_MAX_SIZE` - Max upload size in bytes (default: 10485760 = 10MB)

### Database Setup

1. Create database directory:
```bash
sudo mkdir -p /var/lib/alta52
sudo chown -R $USER:$USER /var/lib/alta52
chmod 755 /var/lib/alta52
```

2. Initialize the database:
```bash
DB_PATH=/var/lib/alta52/alta52.db npm run init-db
```

3. Verify database was created:
```bash
ls -lh /var/lib/alta52/alta52.db
```

### Logs Setup

1. Create logs directory:
```bash
sudo mkdir -p /var/log/alta52
sudo chown -R $USER:$USER /var/log/alta52
chmod 755 /var/log/alta52
```

### Uploads Directory

1. Create uploads directory:
```bash
mkdir -p uploads
chmod 755 uploads
```

### PM2 Deployment

1. Create a `.env` file in the project root:
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secure-jwt-secret-min-32-chars-here
SESSION_SECRET=your-secure-session-secret-min-32-chars-here
DB_PATH=/var/lib/alta52/alta52.db
LOG_DIR=/var/log/alta52
CORS_ORIGINS=https://dis-alta.ru,https://www.dis-alta.ru
```

2. Install dependencies:
```bash
npm ci --production
```

3. Start with PM2:
```bash
npm run pm2
# or
pm2 start ecosystem.config.js --env production
```

4. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name dis-alta.ru www.dis-alta.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dis-alta.ru www.dis-alta.ru;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Static files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        alias /path/to/alta52/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Monitoring

1. Check PM2 status:
```bash
pm2 status
pm2 logs alta52
```

2. Monitor resources:
```bash
pm2 monit
```

### Backup

Regular backups of the database are recommended:

```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/var/backups/alta52"
mkdir -p $BACKUP_DIR
cp /var/lib/alta52/alta52.db "$BACKUP_DIR/alta52-$(date +%Y%m%d-%H%M%S).db"
# Keep only last 7 days of backups
find $BACKUP_DIR -name "alta52-*.db" -mtime +7 -delete
```

Add to crontab for daily backups:
```bash
0 2 * * * /path/to/backup-db.sh
```

### Troubleshooting

#### Database not found
- Ensure `DB_PATH` is set correctly
- Verify the database file exists and has proper permissions
- Run `npm run init-db` to create the database

#### JWT/Session errors
- Ensure `JWT_SECRET` and `SESSION_SECRET` are set and are at least 32 characters
- Check that secrets are properly loaded in production environment

#### CORS errors
- Set `CORS_ORIGINS` to include all domains that will access the API
- Ensure origins include the protocol (https://)

#### Upload errors
- Check that the uploads directory exists and is writable
- Verify `UPLOAD_PATH` is set correctly
- Check file size limits in `UPLOAD_MAX_SIZE`

### Security Checklist

- [ ] JWT_SECRET is set to a strong random value
- [ ] SESSION_SECRET is set to a strong random value
- [ ] Database is in a secure location with proper permissions
- [ ] CORS_ORIGINS is set to specific domains (not wildcard)
- [ ] SSL/TLS is enabled (HTTPS)
- [ ] Firewall is configured to allow only necessary ports
- [ ] Regular backups are scheduled
- [ ] PM2 is configured to restart on failure
- [ ] Logs are rotated to prevent disk space issues
