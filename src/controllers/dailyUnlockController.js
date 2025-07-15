const dailyUnlockService = require('../services/dailyUnlockService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

// @desc    Get today's unlock status
// @route   GET /api/daily-unlock/status
// @access  Private
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    const status = await dailyUnlockService.getTodayStatus(userId);

    return successResponse(res, status, 'Today\'s unlock status retrieved successfully');

  } catch (error) {
    console.error('Get today status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Check and unlock tips
// @route   GET /api/daily-unlock/check
// @access  Private
const checkAndUnlockTips = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    const result = await dailyUnlockService.checkAndUnlockTips(userId);

    return successResponse(res, result, 'Tips checked and unlocked successfully');

  } catch (error) {
    console.error('Check and unlock tips error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get unlock history
// @route   GET /api/daily-unlock/history
// @access  Private
const getUnlockHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 7 } = req.query;

    if (!req.user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    const history = await dailyUnlockService.getUnlockHistory(userId, parseInt(limit));

    return successResponse(res, {
      history
    }, 'Unlock history retrieved successfully');

  } catch (error) {
    console.error('Get unlock history error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  getTodayStatus,
  checkAndUnlockTips,
  getUnlockHistory
}; 