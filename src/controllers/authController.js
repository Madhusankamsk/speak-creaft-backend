const User = require('../models/User');
const { generateAccessToken, successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const googleAuthService = require('../services/googleAuthService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const accessToken = generateAccessToken({ userId: user._id });

    const userData = user.toJSON();

    return successResponse(res, {
      user: userData,
      accessToken
    }, SUCCESS_MESSAGES.USER_CREATED);

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 401);
    }

    // Generate token
    const accessToken = generateAccessToken({ userId: user._id });

    const userData = user.toJSON();

    return successResponse(res, {
      user: userData,
      accessToken
    }, SUCCESS_MESSAGES.LOGIN_SUCCESS);

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // TODO: Implement refresh token logic
    // For now, return error
    return errorResponse(res, 'Refresh token functionality not implemented yet', 501);

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return successResponse(res, {
      user: req.user
    }, 'User profile retrieved successfully');

  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return successResponse(res, {}, 'If the email exists, a reset link has been sent');
    }

    // Check if user is a Google user (they don't have passwords)
    if (user.isGoogleUser) {
      return errorResponse(res, 'This account uses Google Sign-In. Please sign in with Google instead.', 400);
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    if (emailService.isConfigured()) {
      try {
        const emailResult = await emailService.sendPasswordResetEmail(
          user.email,
          resetToken,
          user.name
        );

        if (emailResult.success) {
          console.log('Password reset email sent successfully:', emailResult.messageId);
        } else {
          console.error('Failed to send password reset email:', emailResult.error);
          // Continue anyway - don't reveal email sending issues to user
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Continue anyway - don't reveal email sending issues to user
      }
    } else {
      console.warn('Email service not configured - password reset email not sent');
    }

    // Always return success message for security (don't reveal if email exists)
    return successResponse(res, {
      message: 'If the email exists, a reset link has been sent',
      // In development, you might want to return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    }, 'If the email exists, a reset link has been sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
// @desc    Verify reset token
// @route   POST /api/auth/verify-reset-token
// @access  Public
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return errorResponse(res, 'Reset token is required', 400);
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: { $ne: null },
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user || !user.verifyPasswordResetToken(token)) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    // Check if user is a Google user
    if (user.isGoogleUser) {
      return errorResponse(res, 'This account uses Google Sign-In. Please sign in with Google instead.', 400);
    }

    return successResponse(res, { 
      email: user.email,
      verified: true 
    }, 'Reset token verified successfully');

  } catch (error) {
    console.error('Verify reset token error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 'Reset token and new password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: { $ne: null },
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user || !user.verifyPasswordResetToken(token)) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    // Check if user is a Google user
    if (user.isGoogleUser) {
      return errorResponse(res, 'This account uses Google Sign-In. Please sign in with Google instead.', 400);
    }

    // Update password
    user.password = password;
    user.clearPasswordResetToken();
    await user.save();

    console.log('Password reset successfully for user:', user.email);

    return successResponse(res, {}, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken, platform = 'web' } = req.body;

    if (!idToken && !accessToken) {
      return errorResponse(res, 'Google ID token or access token is required', 400);
    }

    // Check if Google OAuth is configured
    if (!googleAuthService.isConfigured()) {
      return errorResponse(res, 'Google OAuth is not configured', 500);
    }

    let googleUser;

    // Verify token with Google
    if (idToken) {
      googleUser = await googleAuthService.verifyIdToken(idToken, platform);
    } else if (accessToken) {
      googleUser = await googleAuthService.verifyAccessToken(accessToken);
    }

    if (!googleUser) {
      return errorResponse(res, 'Invalid Google token', 400);
    }

    if (!googleUser.email) {
      return errorResponse(res, 'Email not provided by Google', 400);
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.googleId }
      ]
    });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.avatar = user.avatar || googleUser.picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
        emailVerified: googleUser.emailVerified || false,
        // No password needed for Google users
        isGoogleUser: true
      });
    }

    // Generate JWT token
    const jwtToken = generateAccessToken({ userId: user._id });

    const userData = user.toJSON();

    return successResponse(res, {
      user: userData,
      accessToken: jwtToken,
      refreshToken: null // Implement if needed
    }, user.isNew ? 'Account created successfully with Google' : 'Login successful');

  } catch (error) {
    console.error('Google auth error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Google OAuth callback (for web)
// @route   POST /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    const { code, platform = 'web' } = req.body;

    if (!code) {
      return errorResponse(res, 'Authorization code is required', 400);
    }

    // Check if Google OAuth is configured
    if (!googleAuthService.isConfigured()) {
      return errorResponse(res, 'Google OAuth is not configured', 500);
    }

    // Exchange code for tokens
    const result = await googleAuthService.exchangeCodeForTokens(code, platform);

    if (!result) {
      return errorResponse(res, 'Failed to exchange authorization code', 400);
    }

    const { userInfo: googleUser, tokens } = result;

    if (!googleUser.email) {
      return errorResponse(res, 'Email not provided by Google', 400);
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.googleId }
      ]
    });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.avatar = user.avatar || googleUser.picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
        emailVerified: googleUser.emailVerified || false,
        isGoogleUser: true
      });
    }

    // Generate JWT token
    const jwtToken = generateAccessToken({ userId: user._id });

    const userData = user.toJSON();

    return successResponse(res, {
      user: userData,
      accessToken: jwtToken,
      refreshToken: null,
      googleTokens: tokens // Include Google tokens if needed
    }, user.isNew ? 'Account created successfully with Google' : 'Login successful');

  } catch (error) {
    console.error('Google callback error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  googleAuth,
  googleCallback
}; 