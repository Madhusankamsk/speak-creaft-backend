const Tip = require('../models/Tip');
const UserTipInteraction = require('../models/UserTipInteraction');
const DailyUnlock = require('../models/DailyUnlock');
const { successResponse, errorResponse, getPaginationParams, getStartOfDay, shuffleArray } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, UNLOCK_TIMES } = require('../utils/constants');

// @desc    Get today's unlocked tips
// @route   GET /api/tips/daily
// @access  Private
const getDailyTips = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getStartOfDay();

    // Get or create daily unlock for today
    let dailyUnlock = await DailyUnlock.findOne({
      userId,
      date: today
    });

    if (!dailyUnlock) {
      // Create new daily unlock with 3 random tips
      dailyUnlock = await createDailyUnlock(userId);
    }

    // Get tips with unlock status
    const tipIds = dailyUnlock.unlockedTips.map(tip => tip.tipId);
    const tips = await Tip.find({ _id: { $in: tipIds } })
      .populate('categoryId', 'name color icon');

    // Get user interactions
    const userInteractions = await UserTipInteraction.find({
      userId,
      tipId: { $in: tipIds }
    });

    // Merge tips with unlock info and user interactions
    const tipsWithStatus = tips.map(tip => {
      const unlockInfo = dailyUnlock.unlockedTips.find(
        ut => ut.tipId.toString() === tip._id.toString()
      );
      const interaction = userInteractions.find(
        ui => ui.tipId.toString() === tip._id.toString()
      );

      return {
        ...tip.toObject(),
        unlockOrder: unlockInfo.unlockOrder,
        unlockTime: unlockInfo.unlockTime,
        isUnlocked: !!unlockInfo.unlockTime,
        isRead: interaction ? interaction.isRead : false,
        isFavorite: interaction ? interaction.isFavorite : false,
        readAt: interaction ? interaction.readAt : null,
        favoritedAt: interaction ? interaction.favoritedAt : null
      };
    });

    return successResponse(res, {
      dailyTips: tipsWithStatus.sort((a, b) => a.unlockOrder - b.unlockOrder),
      unlockDate: dailyUnlock.date,
      tipsRemaining: dailyUnlock.unlockedTips.filter(tip => !tip.unlockTime).length
    }, 'Daily tips retrieved successfully');

  } catch (error) {
    console.error('Get daily tips error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get all tips for user's level
// @route   GET /api/tips/user
// @access  Private
const getUserTips = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    if (!user.quizCompleted) {
      return errorResponse(res, ERROR_MESSAGES.QUIZ_NOT_COMPLETED, 403);
    }

    const tips = await Tip.find({ 
      level: user.level,
      isActive: true 
    })
    .populate('categoryId', 'name color icon')
    .sort({ createdAt: 1 });

    // Get user interactions for these tips
    const userInteractions = await UserTipInteraction.find({
      userId,
      tipId: { $in: tips.map(tip => tip._id) }
    });

    // Merge tips with user interactions
    const tipsWithStatus = tips.map(tip => {
      const interaction = userInteractions.find(
        ui => ui.tipId.toString() === tip._id.toString()
      );

      return {
        ...tip.toObject(),
        isRead: interaction ? interaction.isRead : false,
        isFavorite: interaction ? interaction.isFavorite : false,
        isUnlocked: interaction ? interaction.isUnlocked : false,
        unlockedAt: interaction ? interaction.unlockedAt : null,
        unlockOrder: interaction ? interaction.unlockOrder : null,
        readAt: interaction ? interaction.readAt : null,
        favoritedAt: interaction ? interaction.favoritedAt : null
      };
    });

    return successResponse(res, {
      tips: tipsWithStatus
    }, 'User tips retrieved successfully');

  } catch (error) {
    console.error('Get user tips error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Toggle tip read status
// @route   POST /api/tips/:tipId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { tipId } = req.params;
    const userId = req.user._id;
    const { isRead } = req.body; // Optional: explicitly set read status

    // Check if tip exists
    const tip = await Tip.findById(tipId);
    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    // Allow marking as read/unread for any tip that exists
    // If user can access the tip through the frontend, they should be able to mark it as read/unread
    // The frontend controls what tips are shown to users

    // Get existing interaction to determine current state
    const existingInteraction = await UserTipInteraction.findOne({ userId, tipId });
    
    // Determine new read status
    let newReadStatus;
    if (typeof isRead === 'boolean') {
      // Explicitly set read status from request body
      newReadStatus = isRead;
    } else {
      // Toggle current read status
      newReadStatus = existingInteraction ? !existingInteraction.isRead : true;
    }

    // Prepare update data
    const updateData = { 
      isRead: newReadStatus,
      readAt: newReadStatus ? new Date() : null,
      isUnlocked: true
    };

    // Set unlockedAt if not already set
    if (!existingInteraction || !existingInteraction.unlockedAt) {
      updateData.unlockedAt = new Date();
    }

    const updatedInteraction = await UserTipInteraction.findOneAndUpdate(
      { userId, tipId },
      updateData,
      { upsert: true, new: true }
    );

    return successResponse(res, {
      tipId,
      isRead: updatedInteraction.isRead,
      readAt: updatedInteraction.readAt
    }, updatedInteraction.isRead ? SUCCESS_MESSAGES.TIP_READ : 'Tip marked as unread successfully');

  } catch (error) {
    console.error('Toggle read status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Toggle favorite status
// @route   POST /api/tips/:tipId/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const { tipId } = req.params;
    const userId = req.user._id;

    // Check if tip exists
    const tip = await Tip.findById(tipId);
    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    // Find existing interaction
    let interaction = await UserTipInteraction.findOne({
      userId,
      tipId
    });

    if (!interaction) {
      // Create new interaction
      interaction = await UserTipInteraction.create({
        userId,
        tipId,
        isFavorite: true,
        favoritedAt: new Date()
      });
    } else {
      // Toggle favorite status
      interaction.isFavorite = !interaction.isFavorite;
      interaction.favoritedAt = interaction.isFavorite ? new Date() : null;
      await interaction.save();
    }

    return successResponse(res, {
      tipId,
      isFavorite: interaction.isFavorite,
      favoritedAt: interaction.favoritedAt
    }, SUCCESS_MESSAGES.TIP_FAVORITED);

  } catch (error) {
    console.error('Toggle favorite error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get user's favorite tips
// @route   GET /api/tips/favorites
// @access  Private
const getFavoriteTips = async (req, res) => {
  try {
    const userId = req.user._id;

    const interactions = await UserTipInteraction.find({
      userId,
      isFavorite: true
    }).populate({
      path: 'tipId',
      populate: { path: 'categoryId', select: 'name color icon' }
    });

    const favoriteTips = interactions
      .filter(interaction => interaction.tipId) // Filter out deleted tips
      .map(interaction => ({
        ...interaction.tipId.toObject(),
        // User interaction data
        isRead: interaction.isRead,
        isFavorite: interaction.isFavorite,
        isUnlocked: interaction.isUnlocked,
        readAt: interaction.readAt,
        favoritedAt: interaction.favoritedAt,
        unlockedAt: interaction.unlockedAt
      }));

    return successResponse(res, {
      favorites: favoriteTips
    }, 'Favorite tips retrieved successfully');

  } catch (error) {
    console.error('Get favorite tips error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// Helper function to create daily unlock
const createDailyUnlock = async (userId) => {
  const user = await require('../models/User').findById(userId);
  const today = getStartOfDay();

  // Get available tips for user's level
  const allTips = await Tip.find({
    level: user.level,
    isActive: true
  });

  // Get tips user hasn't unlocked yet
  const unlockedTipIds = await UserTipInteraction.find({
    userId,
    isUnlocked: true
  }).distinct('tipId');

  let availableTips = allTips.filter(tip => 
    !unlockedTipIds.includes(tip._id)
  );

  // If not enough tips available, reset unlocked status
  if (availableTips.length < 3) {
    await UserTipInteraction.updateMany(
      { userId },
      { isUnlocked: false, unlockOrder: null }
    );
    availableTips = allTips;
  }

  // Randomly select 3 tips
  const selectedTips = shuffleArray(availableTips).slice(0, 3);

  // Create unlock schedule for today
  const unlockSchedule = {
    firstUnlock: new Date(today.getTime() + (UNLOCK_TIMES.FIRST * 60 * 60 * 1000)),
    secondUnlock: new Date(today.getTime() + (UNLOCK_TIMES.SECOND * 60 * 60 * 1000)),
    thirdUnlock: new Date(today.getTime() + (UNLOCK_TIMES.THIRD * 60 * 60 * 1000))
  };

  // Create daily unlock record
  const dailyUnlock = await DailyUnlock.create({
    userId,
    date: today,
    unlockedTips: selectedTips.map((tip, index) => ({
      tipId: tip._id,
      unlockTime: null,
      unlockOrder: index + 1
    })),
    unlockSchedule
  });

  return dailyUnlock;
};

module.exports = {
  getDailyTips,
  getUserTips,
  markAsRead,
  toggleFavorite,
  getFavoriteTips
}; 