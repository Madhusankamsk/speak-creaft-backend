const User = require('../models/User');
const UserTipInteraction = require('../models/UserTipInteraction');
const Tip = require('../models/Tip');
const { successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');
const pushNotificationService = require('../services/pushNotificationService');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    return successResponse(res, {
      user
    }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user._id;

    // Check if email is being updated and if it's already taken
    if (req.body.email && req.body.email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return errorResponse(res, 'Email already taken', 400);
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, avatar, ...req.body },
      { new: true, runValidators: true }
    ).select('-password');

    return successResponse(res, {
      user: updatedUser
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    if (!user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    // Get tip statistics
    const totalTips = await Tip.countDocuments({
      level: user.level,
      isActive: true
    });

    const readTips = await UserTipInteraction.countDocuments({
      userId,
      isRead: true
    });

    const favoriteTips = await UserTipInteraction.countDocuments({
      userId,
      isFavorite: true
    });

    const unlockedTips = await UserTipInteraction.countDocuments({
      userId,
      isUnlocked: true
    });

    const progressPercentage = totalTips > 0 ? (readTips / totalTips) * 100 : 0;

    // Get recent activity
    const recentInteractions = await UserTipInteraction.find({
      userId,
      $or: [{ isRead: true }, { isFavorite: true }]
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate({
      path: 'tipId',
      select: 'title categoryId',
      populate: { path: 'categoryId', select: 'name color' }
    });

    return successResponse(res, {
      level: user.level,
      totalTips,
      readTips,
      favoriteTips,
      unlockedTips,
      unreadTips: totalTips - readTips,
      progressPercentage: Math.round(progressPercentage),
      quizScore: user.quizScore,
      quizCompleted: user.quizCompleted,
      recentActivity: recentInteractions
        .filter(interaction => interaction.tipId) // Filter out deleted tips
        .map(interaction => ({
          tipId: interaction.tipId._id,
          tipTitle: interaction.tipId.title,
          category: interaction.tipId.categoryId,
          action: interaction.isRead ? 'read' : 'favorited',
          timestamp: interaction.updatedAt
        }))
    }, 'User statistics retrieved successfully');

  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get user progress by category
// @route   GET /api/users/progress/categories
// @access  Private
const getCategoryProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    if (!user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    // Get all tips for user's level with categories
    const tips = await Tip.find({
      level: user.level,
      isActive: true
    }).populate('categoryId', 'name color');

    // Get user interactions
    const userInteractions = await UserTipInteraction.find({
      userId,
      tipId: { $in: tips.map(tip => tip._id) }
    });

    // Group by category
    const categoryProgress = {};
    
    tips.forEach(tip => {
      const categoryId = tip.categoryId._id.toString();
      const categoryName = tip.categoryId.name;
      const categoryColor = tip.categoryId.color;
      
      if (!categoryProgress[categoryId]) {
        categoryProgress[categoryId] = {
          categoryId,
          categoryName,
          categoryColor,
          totalTips: 0,
          readTips: 0,
          favoriteTips: 0,
          unlockedTips: 0
        };
      }
      
      categoryProgress[categoryId].totalTips++;
      
      const interaction = userInteractions.find(
        ui => ui.tipId.toString() === tip._id.toString()
      );
      
      if (interaction) {
        if (interaction.isRead) categoryProgress[categoryId].readTips++;
        if (interaction.isFavorite) categoryProgress[categoryId].favoriteTips++;
        if (interaction.isUnlocked) categoryProgress[categoryId].unlockedTips++;
      }
    });

    // Calculate percentages
    Object.values(categoryProgress).forEach(category => {
      category.readPercentage = category.totalTips > 0 
        ? Math.round((category.readTips / category.totalTips) * 100) 
        : 0;
      category.unlockPercentage = category.totalTips > 0 
        ? Math.round((category.unlockedTips / category.totalTips) * 100) 
        : 0;
    });

    return successResponse(res, {
      categories: Object.values(categoryProgress)
    }, 'Category progress retrieved successfully');

  } catch (error) {
    console.error('Get category progress error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Register push notification token
// @route   POST /api/users/push-token
// @access  Private
const registerPushToken = async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!token || !platform) {
      return errorResponse(res, 'Token and platform are required', 400);
    }

    // Validate platform
    if (!['ios', 'android', 'web'].includes(platform)) {
      return errorResponse(res, 'Invalid platform. Must be ios, android, or web', 400);
    }

    const result = await pushNotificationService.registerPushToken(
      userId,
      token,
      platform,
      deviceId
    );

    return successResponse(res, result, 'Push token registered successfully');

  } catch (error) {
    console.error('Register push token error:', error);
    if (error.message === 'Invalid Expo push token') {
      return errorResponse(res, 'Invalid push token format', 400);
    }
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Unregister push notification token
// @route   DELETE /api/users/push-token
// @access  Private
const unregisterPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return errorResponse(res, 'Token is required', 400);
    }

    const result = await pushNotificationService.unregisterPushToken(userId, token);

    return successResponse(res, result, 'Push token unregistered successfully');

  } catch (error) {
    console.error('Unregister push token error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getCategoryProgress,
  registerPushToken,
  unregisterPushToken
}; 