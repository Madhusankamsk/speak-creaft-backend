const Admin = require('../models/Admin');
const User = require('../models/User');
const Question = require('../models/Question');
const Tip = require('../models/Tip');
const Category = require('../models/Category');
const UserQuiz = require('../models/UserQuiz');
const Notification = require('../models/Notification');
const { generateAccessToken, successResponse, errorResponse, getPaginationParams } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// @desc    Create admin account
// @route   POST /api/admin/register
// @access  Public
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role = 'admin', permissions = [] } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return errorResponse(res, 'Admin with this email already exists', 400);
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
      role,
      permissions
    });

    await admin.save();

    // Generate token
    const accessToken = generateAccessToken({ adminId: admin._id });

    const adminData = admin.toJSON();

    return successResponse(res, {
      admin: adminData,
      token: accessToken
    }, 'Admin account created successfully');

  } catch (error) {
    console.error('Create admin error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

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
      token: accessToken
    }, 'Admin login successful');

  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Admin logout
// @route   POST /api/admin/logout
// @access  Private (Admin)
const adminLogout = async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    return successResponse(res, {}, 'Admin logout successful');
  } catch (error) {
    console.error('Admin logout error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Verify admin token
// @route   GET /api/admin/verify
// @access  Private (Admin)
const verifyToken = async (req, res) => {
  try {
    return successResponse(res, {
      admin: req.admin
    }, 'Token verified successfully');
  } catch (error) {
    console.error('Verify token error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get statistics
    const [
      totalUsers,
      totalQuestions,
      totalTips,
      completedQuizzes
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Question.countDocuments({ isActive: true }),
      Tip.countDocuments({ isActive: true }),
      User.countDocuments({ quizCompleted: true })
    ]);

    // Get user growth data (last 7 days)
    const userGrowth = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      userGrowth.push(count);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    // Get quiz performance data
    const quizPerformance = {
      labels: ['Beginner', 'Elementary', 'Intermediate', 'Advanced'],
      datasets: []
    };

    const levelCounts = await User.aggregate([
      { $match: { quizCompleted: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const levelData = [0, 0, 0, 0];
    levelCounts.forEach(item => {
      if (item._id >= 0 && item._id < 4) {
        levelData[item._id] = item.count;
      }
    });

    quizPerformance.datasets = levelData;

    return successResponse(res, {
      totalUsers,
      totalQuestions,
      totalTips,
      completedQuizzes,
      userGrowth: {
        labels,
        datasets: userGrowth
      },
      quizPerformance
    }, 'Dashboard stats retrieved successfully');

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
const getRecentActivity = async (req, res) => {
  try {
    const activities = [];

    // Get recent user registrations
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        title: `New user registered: ${user.name}`,
        timestamp: user.createdAt
      });
    });

    // Get recent quiz completions
    const recentQuizzes = await User.find({ quizCompleted: true })
      .sort({ quizDate: -1 })
      .limit(5)
      .select('name level quizDate');

    recentQuizzes.forEach(user => {
      activities.push({
        type: 'quiz_completed',
        title: `${user.name} completed assessment (Level ${user.level})`,
        timestamp: user.quizDate
      });
    });

    // Sort by timestamp and return latest 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activities.splice(10);

    return successResponse(res, activities, 'Recent activity retrieved successfully');

  } catch (error) {
    console.error('Get recent activity error:', error);
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

// @desc    Toggle user status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(res, { user }, 'User status updated successfully');

  } catch (error) {
    console.error('Toggle user status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get all questions
// @route   GET /api/admin/questions
// @access  Private (Admin)
const getQuestions = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, category, difficulty, status } = req.query;

    const filter = {};
    
    // Handle status filter
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    // If no status filter, show all questions (both active and inactive)
    
    if (search) {
      filter.question = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.categoryId = category;
    }
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter)
    ]);

    return successResponse(res, {
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Questions retrieved successfully');

  } catch (error) {
    console.error('Get questions error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get specific question
// @route   GET /api/admin/questions/:id
// @access  Private (Admin)
const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .populate('categoryId', 'name');

    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, { question }, 'Question retrieved successfully');

  } catch (error) {
    console.error('Get question error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Create question
// @route   POST /api/admin/questions
// @access  Private (Admin)
const createQuestion = async (req, res) => {
  try {
    const questionData = req.body;
    
    // Add the current admin as the creator
    questionData.createdBy = req.admin._id;
    
    // Handle category mapping if categoryId is a string
    if (typeof questionData.categoryId === 'string') {
      // Find category by name
      const category = await Category.findOne({ 
        name: { $regex: new RegExp(questionData.categoryId, 'i') },
        isActive: true 
      });
      
      if (category) {
        questionData.categoryId = category._id;
      } else {
        // If no category found, use the first available category
        const defaultCategory = await Category.findOne({ isActive: true });
        if (defaultCategory) {
          questionData.categoryId = defaultCategory._id;
        } else {
          return errorResponse(res, 'No categories available', 400);
        }
      }
    }
    
    const question = new Question(questionData);
    await question.save();

    const populatedQuestion = await Question.findById(question._id)
      .populate('categoryId', 'name');

    return successResponse(res, { question: populatedQuestion }, 'Question created successfully');

  } catch (error) {
    console.error('Create question error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update question
// @route   PUT /api/admin/questions/:id
// @access  Private (Admin)
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const questionData = req.body;

    const question = await Question.findByIdAndUpdate(
      id,
      questionData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, { question }, 'Question updated successfully');

  } catch (error) {
    console.error('Update question error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private (Admin)
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndUpdate(id, { isActive: false });
    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, {}, 'Question deleted successfully');

  } catch (error) {
    console.error('Delete question error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Toggle question status
// @route   PATCH /api/admin/questions/:id/toggle-status
// @access  Private (Admin)
const toggleQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    question.isActive = !question.isActive;
    await question.save();

    return successResponse(res, { question }, 'Question status updated successfully');

  } catch (error) {
    console.error('Toggle question status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get all tips
// @route   GET /api/admin/tips
// @access  Private (Admin)
const getTips = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, category, level } = req.query;

    const filter = { isActive: true };
    
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (level) {
      filter.level = parseInt(level);
    }

    const [tips, total] = await Promise.all([
      Tip.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tip.countDocuments(filter)
    ]);

    return successResponse(res, {
      tips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Tips retrieved successfully');

  } catch (error) {
    console.error('Get tips error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get specific tip
// @route   GET /api/admin/tips/:id
// @access  Private (Admin)
const getTip = async (req, res) => {
  try {
    const { id } = req.params;

    const tip = await Tip.findById(id)
      .populate('category', 'name');

    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    return successResponse(res, { tip }, 'Tip retrieved successfully');

  } catch (error) {
    console.error('Get tip error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Create tip
// @route   POST /api/admin/tips
// @access  Private (Admin)
const createTip = async (req, res) => {
  try {
    const tipData = req.body;
    const tip = new Tip(tipData);
    await tip.save();

    const populatedTip = await Tip.findById(tip._id)
      .populate('category', 'name');

    return successResponse(res, { tip: populatedTip }, 'Tip created successfully');

  } catch (error) {
    console.error('Create tip error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update tip
// @route   PUT /api/admin/tips/:id
// @access  Private (Admin)
const updateTip = async (req, res) => {
  try {
    const { id } = req.params;
    const tipData = req.body;

    const tip = await Tip.findByIdAndUpdate(
      id,
      tipData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    return successResponse(res, { tip }, 'Tip updated successfully');

  } catch (error) {
    console.error('Update tip error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete tip
// @route   DELETE /api/admin/tips/:id
// @access  Private (Admin)
const deleteTip = async (req, res) => {
  try {
    const { id } = req.params;

    const tip = await Tip.findByIdAndUpdate(id, { isActive: false });
    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    return successResponse(res, {}, 'Tip deleted successfully');

  } catch (error) {
    console.error('Delete tip error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Toggle tip status
// @route   PATCH /api/admin/tips/:id/toggle-status
// @access  Private (Admin)
const toggleTipStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const tip = await Tip.findById(id);
    if (!tip) {
      return errorResponse(res, 'Tip not found', 404);
    }

    tip.isActive = !tip.isActive;
    await tip.save();

    return successResponse(res, { tip }, 'Tip status updated successfully');

  } catch (error) {
    console.error('Toggle tip status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    return successResponse(res, { categories }, 'Categories retrieved successfully');

  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get specific category
// @route   GET /api/admin/categories/:id
// @access  Private (Admin)
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, { category }, 'Category retrieved successfully');

  } catch (error) {
    console.error('Get category error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const category = new Category(categoryData);
    await category.save();

    return successResponse(res, { category }, 'Category created successfully');

  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      categoryData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, { category }, 'Category updated successfully');

  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(id, { isActive: false });
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, {}, 'Category deleted successfully');

  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get quiz results
// @route   GET /api/admin/quiz-results
// @access  Private (Admin)
const getQuizResults = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { level, dateFrom, dateTo } = req.query;

    const filter = {};
    
    if (level) {
      filter.level = parseInt(level);
    }
    
    if (dateFrom || dateTo) {
      filter.quizDate = {};
      if (dateFrom) filter.quizDate.$gte = new Date(dateFrom);
      if (dateTo) filter.quizDate.$lte = new Date(dateTo);
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email level quizScore quizTotalQuestions quizPercentage quizDate')
        .sort({ quizDate: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    return successResponse(res, {
      quizResults: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Quiz results retrieved successfully');

  } catch (error) {
    console.error('Get quiz results error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get specific quiz result
// @route   GET /api/admin/quiz-results/:id
// @access  Private (Admin)
const getQuizResult = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name email level quizScore quizTotalQuestions quizPercentage quizDate');

    if (!user) {
      return errorResponse(res, 'Quiz result not found', 404);
    }

    return successResponse(res, { quizResult: user }, 'Quiz result retrieved successfully');

  } catch (error) {
    console.error('Get quiz result error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete quiz result
// @route   DELETE /api/admin/quiz-results/:id
// @access  Private (Admin)
const deleteQuizResult = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, {
      quizCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizPercentage: null,
      quizDate: null
    });

    if (!user) {
      return errorResponse(res, 'Quiz result not found', 404);
    }

    return successResponse(res, {}, 'Quiz result deleted successfully');

  } catch (error) {
    console.error('Delete quiz result error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get notifications
// @route   GET /api/admin/notifications
// @access  Private (Admin)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(res, { notifications }, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Send notification
// @route   POST /api/admin/notifications
// @access  Private (Admin)
const sendNotification = async (req, res) => {
  try {
    const { title, message, type, targetUsers } = req.body;

    const notification = new Notification({
      title,
      message,
      type,
      targetUsers: targetUsers || 'all'
    });

    await notification.save();

    return successResponse(res, { notification }, 'Notification sent successfully');

  } catch (error) {
    console.error('Send notification error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    return successResponse(res, {}, 'Notification deleted successfully');

  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    // This would return comprehensive analytics data
    return successResponse(res, {}, 'Analytics data retrieved successfully');

  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get user growth analytics
// @route   GET /api/admin/analytics/user-growth
// @access  Private (Admin)
const getUserGrowth = async (req, res) => {
  try {
    // Implementation for user growth analytics
    return successResponse(res, {}, 'User growth analytics retrieved successfully');

  } catch (error) {
    console.error('Get user growth error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get quiz performance analytics
// @route   GET /api/admin/analytics/quiz-performance
// @access  Private (Admin)
const getQuizPerformance = async (req, res) => {
  try {
    // Implementation for quiz performance analytics
    return successResponse(res, {}, 'Quiz performance analytics retrieved successfully');

  } catch (error) {
    console.error('Get quiz performance error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get level distribution analytics
// @route   GET /api/admin/analytics/level-distribution
// @access  Private (Admin)
const getLevelDistribution = async (req, res) => {
  try {
    // Implementation for level distribution analytics
    return successResponse(res, {}, 'Level distribution analytics retrieved successfully');

  } catch (error) {
    console.error('Get level distribution error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get daily active users analytics
// @route   GET /api/admin/analytics/daily-active-users
// @access  Private (Admin)
const getDailyActiveUsers = async (req, res) => {
  try {
    // Implementation for daily active users analytics
    return successResponse(res, {}, 'Daily active users analytics retrieved successfully');

  } catch (error) {
    console.error('Get daily active users error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
const getSettings = async (req, res) => {
  try {
    // This would return application settings
    const settings = {
      appName: 'SpeakCraft',
      adminEmail: 'admin@speakcraft.com',
      questionsPerQuiz: 5,
      timeLimit: 10
    };

    return successResponse(res, { settings }, 'Settings retrieved successfully');

  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    // Implementation to update settings
    return successResponse(res, { settings: settingsData }, 'Settings updated successfully');

  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Upload file
// @route   POST /api/admin/upload
// @access  Private (Admin)
const uploadFile = async (req, res) => {
  try {
    // Implementation for file upload
    return successResponse(res, {}, 'File uploaded successfully');

  } catch (error) {
    console.error('Upload file error:', error);
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

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.admin._id;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    return successResponse(res, { admin }, 'Admin profile updated successfully');

  } catch (error) {
    console.error('Update admin profile error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

module.exports = {
  createAdmin,
  adminLogin,
  adminLogout,
  verifyToken,
  getDashboardStats,
  getRecentActivity,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  getTips,
  getTip,
  createTip,
  updateTip,
  deleteTip,
  toggleTipStatus,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getQuizResults,
  getQuizResult,
  deleteQuizResult,
  getNotifications,
  sendNotification,
  deleteNotification,
  getAnalytics,
  getUserGrowth,
  getQuizPerformance,
  getLevelDistribution,
  getDailyActiveUsers,
  getSettings,
  updateSettings,
  uploadFile,
  getAdminProfile,
  updateAdminProfile
}; 