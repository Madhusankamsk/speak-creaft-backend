const Admin = require('../models/Admin');
const User = require('../models/User');
const { generateAccessToken, successResponse, errorResponse, getPaginationParams } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Check if admin is active
    if (!admin.isActive) {
      return errorResponse(res, 'Account is deactivated', 401);
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const accessToken = generateAccessToken({ adminId: admin._id });

    const adminData = admin.toJSON();

    return successResponse(res, {
      admin: adminData,
      accessToken
    }, 'Admin login successful');

  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get statistics
    const [
      totalUsers,
      activeUsersToday,
      newRegistrationsToday,
      quizCompletionsToday,
      totalTips,
      totalQuestions
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        isActive: true, 
        lastLogin: { $gte: today } 
      }),
      User.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: today } 
      }),
      User.countDocuments({ 
        quizCompleted: true, 
        quizDate: { $gte: today } 
      }),
      require('../models/Tip').countDocuments({ isActive: true }),
      require('../models/Question').countDocuments({ isActive: true })
    ]);

    // Get recent activity
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email level quizCompleted createdAt');

    const recentQuizCompletions = await require('../models/UserQuiz')
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    return successResponse(res, {
      statistics: {
        totalUsers,
        activeUsersToday,
        newRegistrationsToday,
        quizCompletionsToday,
        totalTips,
        totalQuestions
      },
      recentActivity: {
        recentUsers,
        recentQuizCompletions
      }
    }, 'Dashboard data retrieved successfully');

  } catch (error) {
    console.error('Get dashboard error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, level, quizCompleted } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (level) {
      filter.level = parseInt(level);
    }
    
    if (quizCompleted !== undefined) {
      filter.quizCompleted = quizCompleted === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    return successResponse(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get specific user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate({
        path: 'quizHistory',
        model: 'UserQuiz',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User retrieved successfully');

  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, level, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return errorResponse(res, 'Email already taken', 400);
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, level, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    return successResponse(res, { user: updatedUser }, SUCCESS_MESSAGES.USER_UPDATED);

  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Soft delete - set isActive to false
    await User.findByIdAndUpdate(id, { isActive: false });

    return successResponse(res, {}, SUCCESS_MESSAGES.USER_DELETED);

  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = async (req, res) => {
  try {
    return successResponse(res, {
      admin: req.admin
    }, 'Admin profile retrieved successfully');

  } catch (error) {
    console.error('Get admin profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  adminLogin,
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAdminProfile
}; 