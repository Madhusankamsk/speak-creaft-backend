# Email Service Configuration Guide for SpeakCraft

## ✅ What's Already Implemented

### Backend Components:
1. **Email Service** - `backend/src/services/emailService.js`
2. **Enhanced Auth Controller** - Updated forgot/reset password logic
3. **User Model** - Added password reset token fields
4. **Email Templates** - Professional HTML and text templates
5. **Nodemailer Integration** - Complete email sending functionality

### Mobile App Components:
1. **ForgotPasswordScreen** - Professional forgot password UI
2. **ResetPasswordScreen** - Password reset with validation
3. **Navigation Integration** - Seamless flow between screens
4. **API Integration** - Backend communication for password reset

## 🔧 Required Email Configuration

### 1. Environment Variables

Add these to your `.env` file in the backend:

```env
# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@speakcraft.com

# Frontend URL (for email links)
FRONTEND_URL=https://yourdomain.com
```

### 2. Gmail Configuration (Recommended)

#### For Gmail:
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

#### Gmail Settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
```

### 3. Other Email Providers

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

#### Mailgun:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## 📧 Email Templates Included

### 1. Password Reset Email
- **Professional HTML design** with SpeakCraft branding
- **Reset button** and **reset code** for mobile app
- **Security warnings** and expiration information
- **Text fallback** for email clients that don't support HTML

### 2. Welcome Email
- **Onboarding message** for new users
- **Feature highlights** (Daily tips, Level assessment, Notifications)
- **Call-to-action** to complete quiz

### 3. Quiz Completion Email
- **Congratulations message** with results
- **Level information** and score
- **Encouragement** to continue learning

## 🔄 Password Reset Flow

### Complete User Journey:

1. **📱 User taps "Forgot Password?"** on login screen
2. **📧 Enter email address** on ForgotPasswordScreen
3. **⏳ Backend processes request**:
   - Validates email exists
   - Generates secure reset token
   - Sends professional email
4. **📬 User receives email** with reset link and code
5. **🔐 User enters reset code** on ResetPasswordScreen
6. **✅ Password reset successful** → Navigate to login

### Security Features:

- **🔒 Secure token generation** - Cryptographically secure random tokens
- **⏰ Token expiration** - 1 hour expiration for security
- **🔐 Hashed token storage** - Tokens hashed in database
- **🛡️ Google user protection** - Prevents password reset for OAuth users
- **🤐 Email enumeration protection** - Same response regardless of email existence

## 🧪 Testing the Implementation

### 1. Backend Testing

Test the forgot password endpoint:

```bash
# Test forgot password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test reset password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "RESET_TOKEN_HERE", "password": "newpassword123"}'
```

### 2. Email Service Testing

Test email configuration:

```javascript
// In your backend, create a test route
router.post('/test-email', async (req, res) => {
  const result = await emailService.sendPasswordResetEmail(
    'test@example.com',
    'test-token-123',
    'Test User'
  );
  res.json(result);
});
```

### 3. Mobile App Testing

1. **Navigate to login screen**
2. **Tap "Forgot Password?"**
3. **Enter email address**
4. **Check email for reset code**
5. **Enter reset code and new password**
6. **Verify login with new password**

## 🔧 Troubleshooting

### Common Issues:

#### "Authentication failed" (Gmail):
- **Solution**: Enable 2FA and use App Password instead of regular password
- **Check**: SMTP_USER and SMTP_PASS are correct

#### "Connection timeout":
- **Solution**: Check SMTP_HOST and SMTP_PORT
- **Check**: Firewall/network restrictions

#### "Email not received":
- **Check**: Spam/junk folder
- **Check**: Email address is correct
- **Check**: SMTP_FROM is valid

#### "Invalid reset token":
- **Check**: Token hasn't expired (1 hour limit)
- **Check**: Token is entered correctly
- **Check**: Database connection is working

### Debug Commands:

```bash
# Check email service configuration
curl http://localhost:5000/api/auth/email-config

# Test SMTP connection
node -e "
const emailService = require('./src/services/emailService');
emailService.verifyConnection().then(console.log);
"
```

## 📱 Mobile App Features

### ForgotPasswordScreen:
- **📧 Email validation** - Real-time email format checking
- **🎨 Professional UI** - Consistent with app design
- **⏳ Loading states** - User feedback during processing
- **✅ Success feedback** - Clear confirmation of email sent
- **🔄 Resend functionality** - Easy to request new email

### ResetPasswordScreen:
- **🔐 Password validation** - Real-time requirements checking
- **👁️ Show/hide password** - User-friendly password entry
- **✅ Password confirmation** - Prevents typos
- **📋 Requirements display** - Clear password rules
- **🛡️ Security feedback** - Token validation and error handling

## 🚀 Production Considerations

### Email Delivery:
- **📧 Use professional email service** (SendGrid, Mailgun, SES)
- **📊 Monitor delivery rates** and bounce rates
- **🔒 Set up SPF, DKIM, DMARC** records for better deliverability
- **📈 Track email opens** and clicks if needed

### Security:
- **⏰ Consider shorter token expiration** for high-security applications
- **🔒 Rate limiting** on forgot password requests
- **📝 Audit logging** for password reset attempts
- **🛡️ Additional verification** for sensitive accounts

### User Experience:
- **📱 Deep linking** from email to mobile app
- **🔄 Auto-fill reset codes** from SMS or email
- **💾 Remember email** across password reset flow
- **🎯 Clear error messages** and help text

## 📊 Expected Results

After complete setup:

- ✅ **Professional password reset emails** with SpeakCraft branding
- ✅ **Secure token-based reset** with 1-hour expiration
- ✅ **Mobile-optimized UI** for forgot/reset password flow
- ✅ **Cross-platform compatibility** (iOS, Android, web)
- ✅ **Google user protection** - prevents password reset for OAuth users
- ✅ **Email enumeration protection** - secure against user discovery
- ✅ **Professional email templates** for all user communications

**Your SpeakCraft app now has a complete, secure, and user-friendly password reset system that provides a professional experience for users who forget their passwords!** 🎉📧🔐

The system is designed to be:
- **✅ Secure** - Cryptographically secure tokens with proper expiration
- **✅ User-friendly** - Clear UI flow with helpful feedback
- **✅ Professional** - Branded email templates with proper formatting
- **✅ Scalable** - Handles high volume of password reset requests
- **✅ Maintainable** - Clean code structure with comprehensive error handling