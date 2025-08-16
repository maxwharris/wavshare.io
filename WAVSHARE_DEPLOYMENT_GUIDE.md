# wavshare.io Deployment Guide

Complete guide for deploying wavshare to production on a single EC2 server.

## Prerequisites

- AWS EC2 instance (t3.medium or larger recommended)
- Ubuntu 22.04 LTS
- Domain: wavshare.io pointed to your EC2 IP
- SSH access to the server

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx, PM2, and essentials
sudo apt install nginx git ufw -y
sudo npm install -g pm2

# Configure firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable
```

### 2. Clone and Setup Application

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/maxwharris/wavshare.io.git
cd wavshare.io

# Install dependencies
npm run install:all

# Build TypeScript server
cd server && npm run build && cd ..

# Build React client
npm run build:prod
```

### 3. Database Setup

```bash
# Generate Prisma client and run migrations
npm run db:generate
npm run migrate:prod

# Create uploads directory
mkdir -p server/uploads/audio
mkdir -p server/logs
sudo chown -R ubuntu:ubuntu server/uploads
sudo chown -R ubuntu:ubuntu server/logs
```

### 4. Environment Configuration

The production environment files are already configured:

- `server/.env.production` - Server configuration with wavshare.io URLs
- `client/.env.production` - Client configuration with wavshare.io API URLs

**Important**: Update the JWT secret in `server/.env.production`:
```bash
# Generate a secure JWT secret (64+ characters)
openssl rand -base64 64
```

Replace the JWT_SECRET in `server/.env.production` with the generated value.

### 5. nginx Configuration

```bash
# Copy nginx configuration
sudo cp nginx-wavshare.io.conf /etc/nginx/sites-available/wavshare.io

# Enable the site
sudo ln -s /etc/nginx/sites-available/wavshare.io /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
```

### 6. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d wavshare.io -d www.wavshare.io

# Test automatic renewal
sudo certbot renew --dry-run
```

### 7. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 8. Start nginx

```bash
# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Verification

### 1. Check Services

```bash
# Check PM2 status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs wavshare-api

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Test Application

```bash
# Test API health endpoint
curl https://wavshare.io/api/health

# Test frontend
curl -I https://wavshare.io
```

### 3. Browser Testing

Visit https://wavshare.io and test:
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Audio upload works
- [ ] Audio playback works
- [ ] All API endpoints respond correctly

## Maintenance Commands

### Application Management

```bash
# Restart application
pm2 restart wavshare-api

# View logs
pm2 logs wavshare-api

# Monitor application
pm2 monit

# Stop application
pm2 stop wavshare-api
```

### nginx Management

```bash
# Restart nginx
sudo systemctl restart nginx

# Reload nginx configuration
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### Database Management

```bash
# Backup database
cp server/database/wavshare_production.db backups/backup-$(date +%Y%m%d).db

# View database
cd server && npx prisma studio
```

### SSL Certificate Renewal

```bash
# Renew certificates (automatic via cron)
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if PM2 application is running: `pm2 status`
   - Check application logs: `pm2 logs wavshare-api`
   - Restart application: `pm2 restart wavshare-api`

2. **CORS Errors**
   - Verify CLIENT_URL in `server/.env.production` matches domain
   - Check nginx proxy headers configuration

3. **File Upload Issues**
   - Check upload directory permissions: `ls -la server/uploads`
   - Verify MAX_FILE_SIZE in environment variables

4. **Database Connection Issues**
   - Check DATABASE_URL in `server/.env.production`
   - Verify database file exists: `ls -la server/database/`

### Log Locations

- Application logs: `pm2 logs wavshare-api`
- nginx access logs: `/var/log/nginx/access.log`
- nginx error logs: `/var/log/nginx/error.log`
- SSL certificate logs: `/var/log/letsencrypt/letsencrypt.log`

## Security Considerations

1. **Firewall**: Only ports 22, 80, and 443 should be open
2. **SSH**: Use key-based authentication, disable password auth
3. **Updates**: Regularly update system packages and Node.js
4. **Backups**: Implement automated database backups
5. **Monitoring**: Set up uptime monitoring for the domain

## Performance Optimization

1. **nginx Caching**: Static assets are cached for 1 year
2. **Gzip Compression**: Enabled for text-based content
3. **PM2 Monitoring**: Built-in process monitoring and restart
4. **Database**: SQLite is optimized for single-server deployments

## Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Backup database
cp server/database/wavshare_production.db $BACKUP_DIR/db_backup_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz server/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/wavshare.io/backup.sh") | crontab -
```

## Support

For issues or questions:
- Check application logs: `pm2 logs wavshare-api`
- Review nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Monitor system resources: `htop`
- Check disk space: `df -h`
