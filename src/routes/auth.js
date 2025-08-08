const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  refreshToken, 
  getMe, 
  forgotPassword, 
  verifyResetToken,
  resetPassword,
  googleAuth,
  googleCallback
} = require('../controllers/authController');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');
const { userAuth } = require('../middleware/auth');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Test email configuration (development only)
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

// Google OAuth routes
router.post('/google', googleAuth);
router.post('/google/callback', googleCallback);

// Protected routes
router.get('/me', userAuth, getMe);

module.exports = router; 