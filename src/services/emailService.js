const nodemailer = require('nodemailer');
const { logInfo, logError } = require('../utils/helpers');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      // Configure based on environment variables
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      logInfo('Email service initialized successfully');
    } catch (error) {
      logError(error, 'initializeTransporter');
      this.transporter = null;
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      logInfo('Email service connection verified');
      return true;
    } catch (error) {
      logError(error, 'verifyConnection');
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: 'SpeakCraft',
          address: process.env.SMTP_FROM || process.env.SMTP_USER
        },
        to: email,
        subject: 'Reset Your SpeakCraft Password',
        html: this.getPasswordResetTemplate(userName, resetUrl, resetToken),
        text: this.getPasswordResetTextTemplate(userName, resetUrl, resetToken)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logInfo('Password reset email sent successfully', {
        email: email,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logError(error, 'sendPasswordResetEmail');
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send welcome email for new users
  async sendWelcomeEmail(email, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: {
          name: 'SpeakCraft',
          address: process.env.SMTP_FROM || process.env.SMTP_USER
        },
        to: email,
        subject: 'Welcome to SpeakCraft! 🎉',
        html: this.getWelcomeTemplate(userName),
        text: this.getWelcomeTextTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logInfo('Welcome email sent successfully', {
        email: email,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logError(error, 'sendWelcomeEmail');
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send quiz completion email
  async sendQuizCompletionEmail(email, userName, level, score) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: {
          name: 'SpeakCraft',
          address: process.env.SMTP_FROM || process.env.SMTP_USER
        },
        to: email,
        subject: 'Quiz Completed - Your English Level Results! 🎯',
        html: this.getQuizCompletionTemplate(userName, level, score),
        text: this.getQuizCompletionTextTemplate(userName, level, score)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logInfo('Quiz completion email sent successfully', {
        email: email,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logError(error, 'sendQuizCompletionEmail');
      return {
        success: false,
        error: error.message
      };
    }
  }

  // HTML template for password reset email
  getPasswordResetTemplate(userName, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your SpeakCraft Password</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 15px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { background-color: #5856eb; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .warning { background-color: #fef3cd; border: 1px solid #fceeba; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .code { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; text-align: center; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SpeakCraft</div>
                <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p>Hello ${userName || 'there'},</p>
                
                <p>We received a request to reset your password for your SpeakCraft account. If you made this request, you can reset your password using the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                
                <p>Or enter this 6-digit reset code in the app:</p>
                <div class="code">${resetToken}</div>
                
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This reset link will expire in 1 hour</li>
                        <li>If you didn't request this reset, you can safely ignore this email</li>
                        <li>Your password won't change until you create a new one</li>
                    </ul>
                </div>
                
                <p>If you're having trouble with the button above, you can also reset your password by opening the SpeakCraft app and entering the 6-digit reset code shown above.</p>
                
                <p>Best regards,<br>The SpeakCraft Team</p>
            </div>
            
            <div class="footer">
                <p>If you have any questions, please contact us at support@speakcraft.com</p>
                <p>&copy; 2024 SpeakCraft. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Text template for password reset email
  getPasswordResetTextTemplate(userName, resetUrl, resetToken) {
    return `
SpeakCraft - Password Reset Request

Hello ${userName || 'there'},

We received a request to reset your password for your SpeakCraft account.

Reset your password by visiting this link:
${resetUrl}

Or use this 6-digit reset code in the app: ${resetToken}

IMPORTANT:
- This reset link will expire in 1 hour
- If you didn't request this reset, you can safely ignore this email
- Your password won't change until you create a new one

Best regards,
The SpeakCraft Team

If you have any questions, please contact us at support@speakcraft.com
    `;
  }

  // HTML template for welcome email
  getWelcomeTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SpeakCraft!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .content { padding: 30px 0; }
            .feature { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SpeakCraft</div>
                <h1>Welcome to SpeakCraft! 🎉</h1>
            </div>
            
            <div class="content">
                <p>Hello ${userName},</p>
                
                <p>Welcome to SpeakCraft! We're excited to help you on your English learning journey.</p>
                
                <p>Here's what you can expect:</p>
                
                <div class="feature">
                    <strong>📚 Daily English Tips</strong><br>
                    Get 3 personalized tips every day to improve your English skills
                </div>
                
                <div class="feature">
                    <strong>🎯 Level Assessment</strong><br>
                    Take our quiz to get tips tailored to your English level
                </div>
                
                <div class="feature">
                    <strong>🔔 Smart Notifications</strong><br>
                    Never miss a tip with our timely notifications
                </div>
                
                <p>Ready to get started? Open the SpeakCraft app and take your level assessment quiz!</p>
                
                <p>Happy learning!<br>The SpeakCraft Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 SpeakCraft. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Text template for welcome email
  getWelcomeTextTemplate(userName) {
    return `
SpeakCraft - Welcome! 🎉

Hello ${userName},

Welcome to SpeakCraft! We're excited to help you on your English learning journey.

Here's what you can expect:

📚 Daily English Tips
Get 3 personalized tips every day to improve your English skills

🎯 Level Assessment  
Take our quiz to get tips tailored to your English level

🔔 Smart Notifications
Never miss a tip with our timely notifications

Ready to get started? Open the SpeakCraft app and take your level assessment quiz!

Happy learning!
The SpeakCraft Team

© 2024 SpeakCraft. All rights reserved.
    `;
  }

  // HTML template for quiz completion email
  getQuizCompletionTemplate(userName, level, score) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quiz Completed - Your Results!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .content { padding: 30px 0; }
            .result-box { background-color: #e0f2fe; border: 2px solid #0288d1; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .level { font-size: 24px; font-weight: bold; color: #0288d1; }
            .score { font-size: 18px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SpeakCraft</div>
                <h1>Quiz Completed! 🎯</h1>
            </div>
            
            <div class="content">
                <p>Congratulations ${userName}!</p>
                
                <p>You've successfully completed your English level assessment. Here are your results:</p>
                
                <div class="result-box">
                    <div class="level">Your English Level: ${level}</div>
                    <div class="score">Score: ${score}%</div>
                </div>
                
                <p>Based on your results, you'll now receive personalized English tips tailored to your ${level} level. These tips will help you improve your English skills effectively.</p>
                
                <p>Your daily tips are waiting for you in the app. Keep learning and improving every day!</p>
                
                <p>Best regards,<br>The SpeakCraft Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 SpeakCraft. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Text template for quiz completion email
  getQuizCompletionTextTemplate(userName, level, score) {
    return `
SpeakCraft - Quiz Completed! 🎯

Congratulations ${userName}!

You've successfully completed your English level assessment.

Your Results:
- English Level: ${level}
- Score: ${score}%

Based on your results, you'll now receive personalized English tips tailored to your ${level} level. These tips will help you improve your English skills effectively.

Your daily tips are waiting for you in the app. Keep learning and improving every day!

Best regards,
The SpeakCraft Team

© 2024 SpeakCraft. All rights reserved.
    `;
  }

  // Check if email service is configured
  isConfigured() {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS && this.transporter);
  }

  // Get configuration status
  getConfigurationStatus() {
    return {
      configured: this.isConfigured(),
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER ? '***configured***' : 'not configured',
      hasTransporter: !!this.transporter
    };
  }
}

module.exports = new EmailService();