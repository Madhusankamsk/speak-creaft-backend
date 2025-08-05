const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  refreshToken, 
  getMe, 
  forgotPassword, 
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
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.post('/google', googleAuth);
router.post('/google/callback', googleCallback);

// Protected routes
router.get('/me', userAuth, getMe);

module.exports = router; 