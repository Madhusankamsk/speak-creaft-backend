const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const FAQ = require('../models/FAQ');
const LegalDocument = require('../models/LegalDocument');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return errorResponse(res, 'Email is already taken', 400);
      }
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return errorResponse(res, 'Current password is required', 400);
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return errorResponse(res, 'Current password is incorrect', 400);
      }

      if (newPassword.length < 6) {
        return errorResponse(res, 'New password must be at least 6 characters', 400);
      }

      user.password = newPassword;
    }

    // Update other fields
    if (name) user.name = name.trim();
    if (email) user.email = email.trim();

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(userId).select('-password');

    return successResponse(res, { user: updatedUser }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update user profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update user profile picture
// @route   POST /api/profile/avatar
// @access  Private
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return errorResponse(res, 'No image file uploaded', 400);
    }

    // Get file URL (Cloudinary or local)
    const avatarUrl = req.file.path || `/uploads/${req.file.filename}`;

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { 
      user: updatedUser,
      avatar: avatarUrl 
    }, 'Profile picture updated successfully');

  } catch (error) {
    console.error('Update profile picture error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get notification settings
// @route   GET /api/profile/notification-settings
// @access  Private
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const settings = user.notificationSettings || {
      tipUnlocks: true,
      dailyReminders: true,
      weeklyProgress: true,
      achievements: true,
      systemUpdates: false,
      marketing: false
    };

    return successResponse(res, { settings }, 'Notification settings retrieved successfully');

  } catch (error) {
    console.error('Get notification settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update notification settings
// @route   PUT /api/profile/notification-settings
// @access  Private
const updateNotificationSettings = async (req, res) => {
  try {
    const {
      tipUnlocks,
      dailyReminders,
      weeklyProgress,
      achievements,
      systemUpdates,
      marketing
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update notification settings
    user.notificationSettings = {
      tipUnlocks: typeof tipUnlocks === 'boolean' ? tipUnlocks : user.notificationSettings?.tipUnlocks || true,
      dailyReminders: typeof dailyReminders === 'boolean' ? dailyReminders : user.notificationSettings?.dailyReminders || true,
      weeklyProgress: typeof weeklyProgress === 'boolean' ? weeklyProgress : user.notificationSettings?.weeklyProgress || true,
      achievements: typeof achievements === 'boolean' ? achievements : user.notificationSettings?.achievements || true,
      systemUpdates: typeof systemUpdates === 'boolean' ? systemUpdates : user.notificationSettings?.systemUpdates || false,
      marketing: typeof marketing === 'boolean' ? marketing : user.notificationSettings?.marketing || false
    };

    await user.save();

    return successResponse(res, { settings: user.notificationSettings }, 'Notification settings updated successfully');

  } catch (error) {
    console.error('Update notification settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Send contact message
// @route   POST /api/profile/contact
// @access  Private
const sendContactMessage = async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!subject || !subject.trim()) {
      return errorResponse(res, 'Subject is required', 400);
    }

    if (!message || !message.trim()) {
      return errorResponse(res, 'Message is required', 400);
    }

    if (message.trim().length < 10) {
      return errorResponse(res, 'Message must be at least 10 characters long', 400);
    }

    // Create contact message
    const contactMessage = new ContactMessage({
      userId,
      subject: subject.trim(),
      message: message.trim(),
      category: category || 'general'
    });

    await contactMessage.save();

    // Populate user info for admin notifications
    await contactMessage.populate('userId', 'name email');

    return successResponse(res, { 
      messageId: contactMessage._id,
      status: contactMessage.status 
    }, 'Message sent successfully');

  } catch (error) {
    console.error('Send contact message error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get FAQs
// @route   GET /api/profile/faqs
// @access  Private
const getFAQs = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let query = { isActive: true };

    // Add category filter
    if (category) {
      query.category = category;
    }

    let faqs;
    
    // Search in questions and answers
    if (search && search.trim()) {
      faqs = await FAQ.find({
        ...query,
        $text: { $search: search.trim() }
      }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, order: 1 })
      .select('question answer category order');
    } else {
      faqs = await FAQ.find(query)
        .sort({ order: 1, createdAt: -1 })
        .select('question answer category order');
    }

    return successResponse(res, { faqs }, 'FAQs retrieved successfully');

  } catch (error) {
    console.error('Get FAQs error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get terms of service
// @route   GET /api/profile/terms-of-service
// @access  Private
const getTermsOfService = async (req, res) => {
  try {
    const terms = await LegalDocument.findOne({
      type: 'terms_of_service',
      isActive: true
    }).select('content version effectiveDate updatedAt');

    if (!terms) {
      return errorResponse(res, 'Terms of Service not found', 404);
    }

    return successResponse(res, {
      content: terms.content,
      version: terms.version,
      lastUpdated: terms.updatedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      effectiveDate: terms.effectiveDate
    }, 'Terms of Service retrieved successfully');

  } catch (error) {
    console.error('Get terms of service error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get privacy policy
// @route   GET /api/profile/privacy-policy
// @access  Private
const getPrivacyPolicy = async (req, res) => {
  try {
    const privacy = await LegalDocument.findOne({
      type: 'privacy_policy',
      isActive: true
    }).select('content version effectiveDate updatedAt');

    if (!privacy) {
      return errorResponse(res, 'Privacy Policy not found', 404);
    }

    return successResponse(res, {
      content: privacy.content,
      version: privacy.version,
      lastUpdated: privacy.updatedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      effectiveDate: privacy.effectiveDate
    }, 'Privacy Policy retrieved successfully');

  } catch (error) {
    console.error('Get privacy policy error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get user statistics and progress data
// @route   GET /api/profile/statistics
// @access  Private
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    // Import models here to avoid circular dependencies
    const UserQuiz = require('../models/UserQuiz');
    const UserTipInteraction = require('../models/UserTipInteraction');
    const DailyUnlock = require('../models/DailyUnlock');
    const Notification = require('../models/Notification');

    // Get quiz statistics
    const quizHistory = await UserQuiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5); // Last 5 quiz attempts

    // Calculate quiz statistics
    const totalQuizAttempts = quizHistory.length;
    const bestScore = quizHistory.length > 0 
      ? Math.max(...quizHistory.map(q => (q.score / q.totalQuestions) * 100))
      : 0;
    const averageScore = quizHistory.length > 0
      ? quizHistory.reduce((sum, q) => sum + ((q.score / q.totalQuestions) * 100), 0) / totalQuizAttempts
      : 0;

    // Get tips statistics
    const [
      totalTipsRead,
      totalTipsFavorited,
      totalDaysActive,
      recentActivity,
      unreadNotifications
    ] = await Promise.all([
      UserTipInteraction.countDocuments({ userId, isRead: true }),
      UserTipInteraction.countDocuments({ userId, isFavorite: true }),
      DailyUnlock.countDocuments({ userId }),
      DailyUnlock.find({ userId })
        .sort({ date: -1 })
        .limit(7)
        .populate('unlockedTips.tipId', 'title type'),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    // Calculate learning streak (consecutive days with activity)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (recentActivity.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Sort activity by date descending
      const sortedActivity = recentActivity.sort((a, b) => b.date - a.date);
      
      for (let i = 0; i < sortedActivity.length; i++) {
        const activityDate = new Date(sortedActivity[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (activityDate.getTime() === expectedDate.getTime()) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 0;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    // Calculate weekly progress
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyStats = await Promise.all([
      UserTipInteraction.countDocuments({ 
        userId, 
        isRead: true, 
        readAt: { $gte: weekAgo } 
      }),
      DailyUnlock.countDocuments({ 
        userId, 
        date: { $gte: weekAgo } 
      })
    ]);

    // Get level progress
    const levelInfo = {
      current: user.level || 1,
      name: user.level ? ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Upper-Advanced', 'Expert', 'Master', 'Grand Master'][user.level - 1] : 'Beginner',
      progress: user.level ? Math.min((user.level / 10) * 100, 100) : 10
    };

    // Get recent achievements (from notifications)
    const recentAchievements = await Notification.find({
      userId,
      type: 'achievement'
    })
    .sort({ createdAt: -1 })
    .limit(3);

    const statistics = {
      // User basic info
      user: {
        name: user.name,
        email: user.email,
        level: levelInfo,
        joinedDate: user.createdAt,
        lastActive: user.updatedAt
      },
      
      // Quiz statistics
      quiz: {
        completed: user.quizCompleted,
        currentScore: user.quizScore,
        currentPercentage: user.quizScore && user.quizTotalQuestions 
          ? Math.round((user.quizScore / user.quizTotalQuestions) * 100)
          : 0,
        totalAttempts: totalQuizAttempts,
        bestScore: Math.round(bestScore),
        averageScore: Math.round(averageScore),
        completedDate: user.quizDate,
        history: quizHistory.map(q => ({
          id: q._id,
          score: q.score,
          totalQuestions: q.totalQuestions,
          percentage: Math.round((q.score / q.totalQuestions) * 100),
          timeSpent: q.timeSpent,
          level: q.assignedLevel,
          date: q.createdAt
        }))
      },
      
      // Tips and learning statistics
      learning: {
        totalTipsRead,
        totalTipsFavorited,
        totalDaysActive,
        currentStreak,
        longestStreak,
        weeklyTipsRead: weeklyStats[0],
        weeklyDaysActive: weeklyStats[1],
        recentActivity: recentActivity.map(day => ({
          date: day.date,
          tipsCount: day.unlockedTips.filter(t => t.unlockTime).length,
          tips: day.unlockedTips
            .filter(t => t.unlockTime && t.tipId)
            .map(t => ({
              id: t.tipId._id,
              title: t.tipId.title,
              type: t.tipId.type,
              unlockOrder: t.unlockOrder
            }))
        }))
      },
      
      // Achievements and notifications
      achievements: {
        recent: recentAchievements.map(notif => ({
          id: notif._id,
          title: notif.title,
          message: notif.message,
          date: notif.createdAt,
          data: notif.data
        })),
        unreadNotifications
      }
    };

    return successResponse(res, statistics, 'User statistics retrieved successfully');

  } catch (error) {
    console.error('Get user statistics error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  getUserStatistics,
  getNotificationSettings,
  updateNotificationSettings,
  sendContactMessage,
  getFAQs,
  getTermsOfService,
  getPrivacyPolicy
};