# Environment Configuration Setup for SpeakCraft

## 🚨 IMPORTANT: Email Service Not Configured

The email service is currently not configured, which is why password reset emails are not being sent. Follow the steps below to fix this.

## 📋 Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/speakcraft

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Gmail SMTP) - REQUIRED FOR PASSWORD RESET
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@speakcraft.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## 🔧 Email Service Setup (CRITICAL)

### Option 1: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Configure in .env**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-gmail@gmail.com
```

### Option 2: Other Email Providers

#### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## 🧪 Testing Email Configuration

### 1. Test Email Service

Add this test route to your backend:

```javascript
// In backend/src/routes/auth.js
router.post('/test-email', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    
    // Test email configuration
    const configStatus = emailService.getConfigurationStatus();
    console.log('Email config status:', configStatus);
    
    if (!emailService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Email service not configured',
        config: configStatus
      });
    }
    
    // Test connection
    const connectionTest = await emailService.verifyConnection();
    if (!connectionTest) {
      return res.status(400).json({
        success: false,
        message: 'Email connection failed',
        config: configStatus
      });
    }
    
    // Send test email
    const result = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-token-123',
      'Test User'
    );
    
    res.json({
      success: true,
      message: 'Email test completed',
      result: result,
      config: configStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message
    });
  }
});
```

### 2. Test with curl

```bash
# Test email configuration
curl -X POST http://localhost:5000/api/auth/test-email

# Test forgot password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🔍 Troubleshooting

### Common Email Issues:

1. **"Authentication failed" (Gmail)**:
   - ✅ Enable 2FA on Gmail account
   - ✅ Use App Password, not regular password
   - ✅ Check SMTP_USER and SMTP_PASS are correct

2. **"Connection timeout"**:
   - ✅ Check SMTP_HOST and SMTP_PORT
   - ✅ Check firewall/network restrictions
   - ✅ Try different SMTP providers

3. **"Email not received"**:
   - ✅ Check spam/junk folder
   - ✅ Verify email address is correct
   - ✅ Check SMTP_FROM is valid

### Debug Commands:

```bash
# Check if .env file exists
ls -la backend/.env

# Check environment variables
node -e "console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'not configured');"

# Test email service directly
node -e "
const emailService = require('./src/services/emailService');
console.log('Config status:', emailService.getConfigurationStatus());
emailService.verifyConnection().then(result => console.log('Connection test:', result));
"
```

## 🚀 Quick Setup Steps

1. **Create .env file**:
   ```bash
   cd backend
   cp .env.example .env  # if .env.example exists
   # or create .env manually with the content above
   ```

2. **Configure Gmail**:
   - Enable 2FA on Gmail
   - Generate App Password
   - Update SMTP_USER and SMTP_PASS in .env

3. **Test configuration**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/test-email
   ```

4. **Restart backend**:
   ```bash
   npm run dev
   ```

5. **Test forgot password**:
   - Open mobile app
   - Go to login screen
   - Tap "Forgot Password?"
   - Enter email and submit
   - Check email for 6-digit OTP code

## ✅ Success Indicators

After proper configuration:

- ✅ `curl -X POST http://localhost:5000/api/auth/test-email` returns success
- ✅ Password reset emails are sent when using forgot password
- ✅ Email contains reset link and 6-digit OTP code
- ✅ 6-digit OTP works in mobile app
- ✅ New password can be set successfully

## 🆘 Still Having Issues?

1. **Check backend logs** for email service errors
2. **Verify .env file** exists and has correct values
3. **Test SMTP connection** manually
4. **Try different email provider** (SendGrid, Mailgun)
5. **Check firewall/network** restrictions

The email service is essential for the password reset functionality. Once configured, users will receive professional password reset emails with reset codes that work in the mobile app. 