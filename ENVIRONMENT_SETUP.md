# Environment Configuration Guide

This guide explains how to set up environment configurations for both development and production environments.

## Overview

The wavshare application uses separate environment files for different deployment scenarios:

### Client (React App)
- `.env` - Default configuration (development)
- `.env.development` - Development-specific settings
- `.env.production` - Production-specific settings

### Server (Node.js/Express)
- `.env` - Default configuration (development)
- `.env.development` - Development-specific settings
- `.env.production` - Production-specific settings

## Environment File Priority

React automatically loads environment files in this order:
1. `.env.production.local` (production only, ignored by git)
2. `.env.local` (ignored by git)
3. `.env.production` or `.env.development` (based on NODE_ENV)
4. `.env`

## Client Configuration

### Development Settings
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug
```

### Production Settings
```bash
REACT_APP_API_URL=https://YOUR_DOMAIN.com
REACT_APP_API_BASE_URL=https://YOUR_DOMAIN.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

## Server Configuration

### Development Settings
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL="file:../database/remixthis.db"
JWT_SECRET=dev-jwt-secret-change-in-production
CLIENT_URL=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Production Settings
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://username:password@YOUR_DOMAIN.com:5432/remixthis_prod"
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_IN_PRODUCTION
CLIENT_URL=https://YOUR_DOMAIN.com
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Instructions

### 1. Replace Placeholders

Before deploying to production, replace these placeholders:

**YOUR_DOMAIN.com** - Replace with your actual domain name
- `https://YOUR_DOMAIN.com`
- `noreply@YOUR_DOMAIN.com`

**Database Configuration** - Set up a production database:
```bash
# PostgreSQL example
DATABASE_URL="postgresql://username:password@host:5432/database"

# MySQL example  
DATABASE_URL="mysql://username:password@host:3306/database"
```

**JWT Secret** - Generate a strong secret:
```bash
# Generate a secure random string (32+ characters)
JWT_SECRET="your-super-secure-random-string-here"
```

**Email Configuration** - Set up email service:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@YOUR_DOMAIN.com
```

### 2. Environment-Specific Deployment

#### Development
```bash
# Client
npm run start  # Automatically uses .env.development

# Server
NODE_ENV=development npm start
```

#### Production
```bash
# Client
npm run build  # Automatically uses .env.production

# Server
NODE_ENV=production npm start
```

### 3. Security Considerations

- Never commit `.env.local` or `.env.production.local` files
- Use strong, unique JWT secrets for production
- Enable HTTPS in production
- Use environment variables for sensitive data in CI/CD pipelines
- Regularly rotate secrets and API keys

### 4. Database Migration for Production

1. Set up a production database (PostgreSQL recommended)
2. Update `DATABASE_URL` in `.env.production`
3. Run Prisma migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. File Storage for Production

Consider using cloud storage for production:
- AWS S3
- Google Cloud Storage
- Cloudinary
- DigitalOcean Spaces

Update the upload configuration accordingly.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CLIENT_URL` matches your frontend domain
2. **Database Connection**: Verify `DATABASE_URL` format and credentials
3. **Environment Variables Not Loading**: Check file names and React app prefix (`REACT_APP_`)
4. **Build Failures**: Ensure all required environment variables are set

### Verification

Test your configuration:

```bash
# Check if environment variables are loaded
console.log('API URL:', process.env.REACT_APP_API_URL);  // Client
console.log('Database URL:', process.env.DATABASE_URL);   // Server
```

## Additional Resources

- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [Prisma Database URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
