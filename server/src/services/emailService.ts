import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate verification expiry (24 hours from now)
export const generateVerificationExpiry = (): Date => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your wavshare account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - wavshare</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 2rem;
              font-weight: bold;
              background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">wavshare</div>
            <p>Music Collaboration Platform</p>
          </div>
          
          <div class="content">
            <h2>Welcome to wavshare, ${username}!</h2>
            <p>Thank you for signing up! To start sharing and remixing music, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with wavshare, you can safely ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 wavshare. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to wavshare, ${username}!
      
      Thank you for signing up! To start sharing and remixing music, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with wavshare, you can safely ignore this email.
      
      © 2024 wavshare. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email (for future use)
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your wavshare password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - wavshare</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 2rem;
              font-weight: bold;
              background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">wavshare</div>
            <p>Music Collaboration Platform</p>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 wavshare. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
