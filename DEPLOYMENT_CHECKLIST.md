# Production Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment Setup

### 1. Environment Configuration
- [ ] Run `npm run setup:prod` to configure production environment
- [ ] Replace `YOUR_DOMAIN.com` with your actual domain in all config files
- [ ] Generate and set a strong JWT secret (64+ characters)
- [ ] Configure production database connection string
- [ ] Set up email service credentials (SMTP)
- [ ] Verify all environment variables are set correctly

### 2. Database Setup
- [ ] Set up production database (PostgreSQL/MySQL recommended)
- [ ] Update `DATABASE_URL` in `server/.env.production`
- [ ] Run database migrations: `npm run migrate:prod`
- [ ] Generate Prisma client: `npm run db:generate`
- [ ] Test database connection

### 3. Security Configuration
- [ ] Enable HTTPS/SSL certificates (Let's Encrypt recommended)
- [ ] Update CORS settings for your domain
- [ ] Set secure JWT secret (different from development)
- [ ] Configure rate limiting for production traffic
- [ ] Review and update security headers (helmet configuration)

### 4. File Storage
- [ ] Set up production file storage solution:
  - [ ] Local storage with proper permissions
  - [ ] Cloud storage (AWS S3, Google Cloud, etc.)
  - [ ] CDN for static assets (optional but recommended)
- [ ] Update upload paths and serving URLs
- [ ] Test file upload and download functionality

## Build and Deployment

### 5. Application Build
- [ ] Build client application: `npm run build:prod`
- [ ] Verify build output in `client/build/`
- [ ] Test production build locally
- [ ] Optimize bundle size if needed

### 6. Server Deployment
- [ ] Choose hosting platform:
  - [ ] VPS (DigitalOcean, Linode, AWS EC2)
  - [ ] Platform-as-a-Service (Heroku, Railway, Render)
  - [ ] Serverless (Vercel, Netlify Functions)
- [ ] Set up server environment
- [ ] Configure reverse proxy (nginx) if needed
- [ ] Set up process manager (PM2, systemd)

### 7. Domain and DNS
- [ ] Purchase and configure domain
- [ ] Set up DNS records:
  - [ ] A record pointing to server IP
  - [ ] CNAME for www subdomain (optional)
  - [ ] MX records for email (if using custom email)
- [ ] Configure SSL certificate
- [ ] Test domain resolution

## Post-Deployment Verification

### 8. Functionality Testing
- [ ] Test user registration and email verification
- [ ] Test user login and authentication
- [ ] Test audio file upload and playback
- [ ] Test post creation and viewing
- [ ] Test commenting and voting
- [ ] Test search functionality
- [ ] Test notifications
- [ ] Test profile management

### 9. Performance and Monitoring
- [ ] Set up monitoring (optional):
  - [ ] Application monitoring (Sentry, New Relic)
  - [ ] Server monitoring (Uptime Robot, Pingdom)
  - [ ] Log aggregation (LogRocket, Papertrail)
- [ ] Test application performance under load
- [ ] Verify database performance
- [ ] Check memory and CPU usage

### 10. Backup and Recovery
- [ ] Set up automated database backups
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Set up file storage backups (if using local storage)

## Security Hardening

### 11. Server Security
- [ ] Update server packages and OS
- [ ] Configure firewall (UFW, iptables)
- [ ] Disable unnecessary services
- [ ] Set up fail2ban for SSH protection
- [ ] Use non-root user for application
- [ ] Configure SSH key authentication

### 12. Application Security
- [ ] Review and test authentication flows
- [ ] Validate input sanitization
- [ ] Test file upload restrictions
- [ ] Verify rate limiting is working
- [ ] Check for exposed sensitive information
- [ ] Test CORS configuration

## Final Steps

### 13. Documentation and Handover
- [ ] Update README with production setup instructions
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Set up team access to production systems
- [ ] Schedule regular maintenance windows

### 14. Go-Live
- [ ] Announce maintenance window (if replacing existing system)
- [ ] Deploy to production
- [ ] Verify all functionality works
- [ ] Monitor for errors and performance issues
- [ ] Announce successful deployment

## Post-Launch Monitoring

### 15. First 24 Hours
- [ ] Monitor error logs
- [ ] Check application performance
- [ ] Verify user registrations are working
- [ ] Monitor database performance
- [ ] Check email delivery
- [ ] Respond to user feedback

### 16. First Week
- [ ] Review performance metrics
- [ ] Analyze user behavior
- [ ] Address any reported issues
- [ ] Optimize based on real usage patterns
- [ ] Plan for scaling if needed

## Emergency Procedures

### Rollback Plan
- [ ] Document rollback procedure
- [ ] Keep previous version deployable
- [ ] Test rollback process in staging
- [ ] Have database rollback strategy

### Contact Information
- [ ] Maintain list of key contacts
- [ ] Set up alerting for critical issues
- [ ] Document escalation procedures

---

## Quick Commands Reference

```bash
# Environment setup
npm run setup:prod

# Database operations
npm run migrate:prod
npm run db:generate

# Build and deploy
npm run build:prod
npm run start:prod

# Check application health
curl https://yourdomain.com/api/health
```

## Common Issues and Solutions

### Database Connection Issues
- Verify DATABASE_URL format
- Check database server is running
- Verify network connectivity
- Check firewall settings

### CORS Errors
- Verify CLIENT_URL matches frontend domain
- Check HTTPS/HTTP protocol consistency
- Verify subdomain configuration

### File Upload Issues
- Check upload directory permissions
- Verify MAX_FILE_SIZE setting
- Check available disk space
- Test with different file types

### Email Not Sending
- Verify SMTP credentials
- Check email service configuration
- Test with email service provider
- Check spam folders

Remember to test each step thoroughly and keep detailed logs of your deployment process!
