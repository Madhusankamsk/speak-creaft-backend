const User = require('../models/User');
const { generateAccessToken, successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

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

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return successResponse(res, {}, 'If the email exists, a reset link has been sent');
    }

    // TODO: Implement email sending with reset token
    // For now, just return success message
    return successResponse(res, {}, 'If the email exists, a reset link has been sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // TODO: Implement password reset logic
    // Verify reset token and update password
    
    return successResponse(res, {}, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword
}; 