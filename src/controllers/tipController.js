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
    } else {
      // Update existing unlock schedule to use new times (in case times were changed)
      const updatedSchedule = {
        firstUnlock: new Date(today.getTime() + (UNLOCK_TIMES.FIRST.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.FIRST.minute * 60 * 1000)),
        secondUnlock: new Date(today.getTime() + (UNLOCK_TIMES.SECOND.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.SECOND.minute * 60 * 1000)),
        thirdUnlock: new Date(today.getTime() + (UNLOCK_TIMES.THIRD.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.THIRD.minute * 60 * 1000))
      };
      
      // Update the schedule if it's different
      if (dailyUnlock.unlockSchedule.thirdUnlock.getTime() !== updatedSchedule.thirdUnlock.getTime()) {
        dailyUnlock.unlockSchedule = updatedSchedule;
        await dailyUnlock.save();
      }

      // Check and unlock any overdue tips when user opens the app
      const now = new Date();
      let hasUpdates = false;

      // Check and unlock overdue tips
      for (let i = 0; i < dailyUnlock.unlockedTips.length; i++) {
        const tipUnlock = dailyUnlock.unlockedTips[i];
        
        // Check if tip should be unlocked based on schedule but isn't yet
        if (!tipUnlock.unlockTime) {
          let shouldUnlock = false;
          let unlockTime = null;

          if (tipUnlock.unlockOrder === 1 && now >= dailyUnlock.unlockSchedule.firstUnlock) {
            shouldUnlock = true;
            unlockTime = dailyUnlock.unlockSchedule.firstUnlock;
          } else if (tipUnlock.unlockOrder === 2 && now >= dailyUnlock.unlockSchedule.secondUnlock) {
            shouldUnlock = true;
            unlockTime = dailyUnlock.unlockSchedule.secondUnlock;
          } else if (tipUnlock.unlockOrder === 3 && now >= dailyUnlock.unlockSchedule.thirdUnlock) {
            shouldUnlock = true;
            unlockTime = dailyUnlock.unlockSchedule.thirdUnlock;
          }

          if (shouldUnlock) {
            // Update the daily unlock record
            dailyUnlock.unlockedTips[i].unlockTime = unlockTime;
            hasUpdates = true;

            // Create or update UserTipInteraction
            await UserTipInteraction.findOneAndUpdate(
              { userId, tipId: tipUnlock.tipId },
              {
                userId,
                tipId: tipUnlock.tipId,
                isUnlocked: true,
                unlockedAt: unlockTime,
                unlockOrder: tipUnlock.unlockOrder
              },
              { upsert: true, new: true }
            );
          }
        }
      }

      // Save updates if any tips were unlocked
      if (hasUpdates) {
        await dailyUnlock.save();
      }
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

    // Calculate next unlock time
    const now = new Date();
    let nextUnlock = null;
    
    if (now < dailyUnlock.unlockSchedule.firstUnlock) {
      nextUnlock = dailyUnlock.unlockSchedule.firstUnlock;
    } else if (now < dailyUnlock.unlockSchedule.secondUnlock) {
      nextUnlock = dailyUnlock.unlockSchedule.secondUnlock;
    } else if (now < dailyUnlock.unlockSchedule.thirdUnlock) {
      nextUnlock = dailyUnlock.unlockSchedule.thirdUnlock;
    }

    return successResponse(res, {
      dailyTips: tipsWithStatus.sort((a, b) => a.unlockOrder - b.unlockOrder),
      unlockDate: dailyUnlock.date,
      tipsRemaining: dailyUnlock.unlockedTips.filter(tip => !tip.unlockTime).length,
      nextUnlock,
      unlockSchedule: dailyUnlock.unlockSchedule
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
  const now = new Date();

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
    firstUnlock: new Date(today.getTime() + (UNLOCK_TIMES.FIRST.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.FIRST.minute * 60 * 1000)),
    secondUnlock: new Date(today.getTime() + (UNLOCK_TIMES.SECOND.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.SECOND.minute * 60 * 1000)),
    thirdUnlock: new Date(today.getTime() + (UNLOCK_TIMES.THIRD.hour * 60 * 60 * 1000) + (UNLOCK_TIMES.THIRD.minute * 60 * 1000))
  };

  // Determine which tips should already be unlocked for new users
  const tipsToCreate = selectedTips.map((tip, index) => {
    const unlockOrder = index + 1;
    let unlockTime = null;
    
    // For new users, immediately unlock tips that should already be available
    if (unlockOrder === 1 && now >= unlockSchedule.firstUnlock) {
      unlockTime = unlockSchedule.firstUnlock;
    } else if (unlockOrder === 2 && now >= unlockSchedule.secondUnlock) {
      unlockTime = unlockSchedule.secondUnlock;
    } else if (unlockOrder === 3 && now >= unlockSchedule.thirdUnlock) {
      unlockTime = unlockSchedule.thirdUnlock;
    }

    return {
      tipId: tip._id,
      unlockTime,
      unlockOrder
    };
  });

  // Create daily unlock record
  const dailyUnlock = await DailyUnlock.create({
    userId,
    date: today,
    unlockedTips: tipsToCreate,
    unlockSchedule
  });

  // Create UserTipInteraction records for already unlocked tips
  for (const tipData of tipsToCreate) {
    if (tipData.unlockTime) {
      await UserTipInteraction.findOneAndUpdate(
        { userId, tipId: tipData.tipId },
        {
          userId,
          tipId: tipData.tipId,
          isUnlocked: true,
          unlockedAt: tipData.unlockTime,
          unlockOrder: tipData.unlockOrder
        },
        { upsert: true, new: true }
      );
    }
  }

  return dailyUnlock;
};

// @desc    Debug endpoint to check unlock schedule
// @route   GET /api/tips/debug-schedule
// @access  Private
const getDebugSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getStartOfDay();
    const now = new Date();

    const dailyUnlock = await DailyUnlock.findOne({
      userId,
      date: today
    });

    if (!dailyUnlock) {
      return successResponse(res, {
        message: 'No daily unlock found for today',
        currentTime: now.toISOString(),
        currentTimeLocal: now.toLocaleString(),
        unlockTimes: UNLOCK_TIMES
      });
    }

    return successResponse(res, {
      currentTime: now.toISOString(),
      currentTimeLocal: now.toLocaleString(),
      unlockSchedule: {
        firstUnlock: dailyUnlock.unlockSchedule.firstUnlock.toISOString(),
        firstUnlockLocal: dailyUnlock.unlockSchedule.firstUnlock.toLocaleString(),
        secondUnlock: dailyUnlock.unlockSchedule.secondUnlock.toISOString(),
        secondUnlockLocal: dailyUnlock.unlockSchedule.secondUnlock.toLocaleString(),
        thirdUnlock: dailyUnlock.unlockSchedule.thirdUnlock.toISOString(),
        thirdUnlockLocal: dailyUnlock.unlockSchedule.thirdUnlock.toLocaleString(),
      },
      configuredTimes: UNLOCK_TIMES,
      timeDifferences: {
        toFirst: dailyUnlock.unlockSchedule.firstUnlock.getTime() - now.getTime(),
        toSecond: dailyUnlock.unlockSchedule.secondUnlock.getTime() - now.getTime(),
        toThird: dailyUnlock.unlockSchedule.thirdUnlock.getTime() - now.getTime(),
      }
    });

  } catch (error) {
    console.error('Debug schedule error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  getDailyTips,
  getUserTips,
  markAsRead,
  toggleFavorite,
  getFavoriteTips,
  getDebugSchedule
}; 