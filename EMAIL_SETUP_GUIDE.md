# Email Service Setup for wavshare.io

This guide explains how to configure email services for user verification and notifications on wavshare.io.

## Email Service Options

### Option 1: Gmail SMTP (Recommended for Development/Small Scale)

1. **Create a Gmail account** for your application:
   - Email: `noreply@wavshare.io` (or use your existing Gmail)

2. **Enable 2-Factor Authentication** on the Gmail account

3. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

4. **Update server/.env.production**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-character-app-password
   FROM_EMAIL=noreply@wavshare.io
   ```

### Option 2: AWS SES (Recommended for Production)

1. **Set up AWS SES**:
   - Go to AWS SES console
   - Verify your domain: wavshare.io
   - Request production access (removes sending limits)

2. **Create SMTP credentials**:
   - In SES console, go to SMTP Settings
   - Create SMTP credentials
   - Note the username and password

3. **Update server/.env.production**:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   FROM_EMAIL=noreply@wavshare.io
   ```

### Option 3: SendGrid (Alternative)

1. **Create SendGrid account**
2. **Generate API key**
3. **Update server/.env.production**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   FROM_EMAIL=noreply@wavshare.io
   ```

## Domain Email Setup (Optional)

To use `noreply@wavshare.io` as the sender address:

### 1. Set up MX Records

Add these DNS records to your domain:

```
Type: MX
Name: @
Value: 10 mail.wavshare.io
TTL: 3600

Type: A
Name: mail
Value: [Your server IP]
TTL: 3600
```

### 2. Set up SPF Record

Add SPF record to prevent spam:

```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all"
TTL: 3600
```

### 3. Set up DKIM (Optional)

For better deliverability, set up DKIM records as provided by your email service.

## Testing Email Configuration

### 1. Test SMTP Connection

Create a test script `test-email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'server/.env.production' });

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'your-test-email@example.com',
      subject: 'wavshare.io Email Test',
      text: 'This is a test email from wavshare.io',
      html: '<p>This is a test email from <strong>wavshare.io</strong></p>'
    });
    
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmail();
```

Run the test:
```bash
cd server
node ../test-email.js
```

### 2. Test User Registration

1. Start your application
2. Register a new user
3. Check if verification email is sent
4. Verify the email link works

## Email Templates

The application uses these email templates (in `server/src/services/emailService.ts`):

### Verification Email
- **Subject**: "Verify your wavshare.io account"
- **Content**: Welcome message with verification link
- **Link**: `https://wavshare.io/verify-email/{token}`

### Password Reset (if implemented)
- **Subject**: "Reset your wavshare.io password"
- **Content**: Password reset instructions
- **Link**: `https://wavshare.io/reset-password/{token}`

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Use app password, not regular password

2. **"Connection timeout"**
   - Check SMTP host and port
   - Verify firewall allows outbound SMTP (port 587)

3. **Emails go to spam**
   - Set up SPF records
   - Use verified domain
   - Avoid spam trigger words

4. **"Sender address rejected"**
   - Verify sender domain with email service
   - Use authenticated sender address

### Debug Email Issues

Enable debug logging in `server/src/services/emailService.ts`:

```javascript
const transporter = nodemailer.createTransporter({
  // ... other config
  debug: true,
  logger: true
});
```

Check application logs:
```bash
pm2 logs wavshare-api
```

## Production Recommendations

1. **Use AWS SES or SendGrid** for production
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates**
4. **Implement email bounce handling**
5. **Use email templates** for consistent branding
6. **Set up email analytics** to track open rates

## Security Considerations

1. **Never commit email credentials** to version control
2. **Use environment variables** for all email configuration
3. **Rotate email credentials** regularly
4. **Monitor for suspicious email activity**
5. **Implement rate limiting** for email sending

## Email Service Limits

### Gmail SMTP
- **Limit**: 500 emails/day
- **Best for**: Development, small applications

### AWS SES
- **Sandbox**: 200 emails/day, verified recipients only
- **Production**: Up to 200 emails/second (with approval)
- **Best for**: Production applications

### SendGrid
- **Free tier**: 100 emails/day
- **Paid plans**: Scale as needed
- **Best for**: Medium to large applications

Choose the service that best fits your expected email volume and budget.
