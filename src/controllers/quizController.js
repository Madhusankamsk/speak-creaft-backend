const Question = require('../models/Question');
const UserQuiz = require('../models/UserQuiz');
const User = require('../models/User');
const { successResponse, errorResponse, getPaginationParams } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, USER_LEVELS } = require('../utils/constants');
const mongoose = require('mongoose'); // Added for mongoose connection state

// Calculate user level based on quiz score
const calculateLevel = (score, totalQuestions) => {
  const percentage = (score / totalQuestions) * 100;
  
  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  if (percentage >= 30) return 4;
  if (percentage >= 20) return 3;
  if (percentage >= 10) return 2;
  return 1;
};

// Get level name
const getLevelName = (level) => {
  return USER_LEVELS.NAMES[level] || 'Unknown';
};

// @desc    Get all quiz questions
// @route   GET /api/quiz/questions
// @access  Public
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true })
      .select('-correctAnswer') // Don't send correct answers to frontend
      .populate('categoryId', 'name color icon')
      .sort({ order: 1 });

    return successResponse(res, {
      questions,
      totalQuestions: questions.length,
      estimatedTime: Math.ceil(questions.length * 0.75) // 45 seconds per question
    }, 'Questions retrieved successfully');

  } catch (error) {
    console.error('Get questions error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quiz/submit
// @access  Private
const submitQuiz = async (req, res) => {
  try {
    const { answers, timeSpent: totalTimeSpentFromClient = 0 } = req.body;
    const userId = req.user ? req.user._id : null;
    console.log('oooooooooooooooooooooooooooooooooooooooooooooooo',req.body)
    console.log('=== Quiz Submission Debug Info ===');
    console.log('User ID:', userId);
    console.log('User object exists:', !!req.user);
    console.log('Answers received:', answers?.length || 0);
    console.log('Total time from client:', totalTimeSpentFromClient);
    console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');

    // Validate user authentication
    if (!userId) {
      console.error('Quiz submission failed: User not authenticated');
      return errorResponse(res, 'User authentication required to save quiz results', 401);
    }

    // Validate answers array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      console.error('Quiz submission failed: Invalid answers array');
      return errorResponse(res, 'Valid answers array is required', 400);
    }

    // Get all questions
    const questions = await Question.find({ isActive: true });
    console.log('Active questions found:', questions.length);
    
    if (questions.length === 0) {
      console.error('Quiz submission failed: No active questions available');
      return errorResponse(res, 'No questions available', 400);
    }

    // Calculate results
    let correctAnswers = 0;
    let totalTimeSpent = 0;
    const detailedAnswers = [];
    const processedQuestionIds = new Set();

    for (const answer of answers) {
      // Validate answer structure
      if (!answer.questionId || !answer.userAnswer) {
        console.warn('Skipping invalid answer:', answer);
        continue;
      }

      const question = questions.find(q => q._id.toString() === answer.questionId);
      
      if (!question) {
        console.warn('Question not found for ID:', answer.questionId);
        continue;
      }

      // Check for duplicate answers
      if (processedQuestionIds.has(answer.questionId)) {
        console.warn('Duplicate answer for question ID:', answer.questionId);
        continue;
      }
      processedQuestionIds.add(answer.questionId);

      const isCorrect = question.correctAnswer === answer.userAnswer;
      const timeSpent = answer.timeSpent || 0;

      if (isCorrect) {
        correctAnswers++;
      }

      totalTimeSpent += timeSpent;

      detailedAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent
      });
    }

    // Use client-provided total time if available and greater than calculated
    if (totalTimeSpentFromClient > totalTimeSpent) {
      totalTimeSpent = totalTimeSpentFromClient;
    }

    // Calculate level
    const level = calculateLevel(correctAnswers, questions.length);

    console.log('=== Quiz Results ===');
    console.log('Correct answers:', correctAnswers);
    console.log('Total questions:', questions.length);
    console.log('Calculated level:', level);
    console.log('Total time spent:', totalTimeSpent);
    console.log('Processed answers:', detailedAnswers.length);

    // Save quiz results to database
    try {
      console.log('Attempting to save quiz results to database...');
      console.log('Database connection state:', mongoose.connection.readyState); // 1 = connected
      console.log('UserQuiz model:', !!UserQuiz);
      console.log('User model:', !!User);
      
      const userQuizData = {
        userId,
        score: correctAnswers,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpent: totalTimeSpent,
        answers: detailedAnswers,
        assignedLevel: level
      };
      
      console.log('Creating UserQuiz with data:', userQuizData);
      
      const userQuiz = await UserQuiz.create(userQuizData);
      
      console.log('UserQuiz created successfully:', {
        id: userQuiz._id,
        userId: userQuiz.userId,
        score: userQuiz.score,
        level: userQuiz.assignedLevel,
        createdAt: userQuiz.createdAt
      });

      // Verify the record was actually saved
      const savedQuiz = await UserQuiz.findById(userQuiz._id);
      console.log('Verification - UserQuiz found in database:', !!savedQuiz);
      
      // Check total UserQuiz count for this user
      const userQuizCount = await UserQuiz.countDocuments({ userId });
      console.log('Total UserQuiz records for user:', userQuizCount);

      // Update user record
      console.log('Updating user record...');
      const updatedUser = await User.findByIdAndUpdate(userId, {
        level,
        quizCompleted: true,
        quizScore: correctAnswers,
        quizTotalQuestions: questions.length,
        quizDate: new Date()
      }, { new: true });
      
      if (!updatedUser) {
        console.error('Failed to update user record');
        return errorResponse(res, 'Failed to update user profile', 500);
      }

      console.log('User profile updated successfully:', {
        id: updatedUser._id,
        level: updatedUser.level,
        quizCompleted: updatedUser.quizCompleted,
        quizScore: updatedUser.quizScore
      });

      console.log('=== Quiz Submission Successful ===');

    } catch (dbError) {
      console.error('Database error while saving quiz results:', dbError);
      console.error('Error stack:', dbError.stack);
      return errorResponse(res, 'Failed to save quiz results to database', 500);
    }

    return successResponse(res, {
      score: correctAnswers,
      totalQuestions: questions.length,
      level,
      levelName: getLevelName(level),
      timeSpent: totalTimeSpent,
      answers: detailedAnswers,
      quizCompleted: true
    }, SUCCESS_MESSAGES.QUIZ_SUBMITTED);

  } catch (error) {
    console.error('Submit quiz error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Check quiz status
// @route   GET /api/quiz/status
// @access  Private
const getQuizStatus = async (req, res) => {
  try {
    const user = req.user;
    
    console.log('Quiz status check - User:', user);
    console.log('Quiz status check - User ID:', user._id);
    console.log('Quiz status check - Quiz completed:', user.quizCompleted);

    return successResponse(res, {
      quizCompleted: user.quizCompleted,
      level: user.level,
      quizScore: user.quizScore,
      quizDate: user.quizDate
    }, 'Quiz status retrieved successfully');

  } catch (error) {
    console.error('Get quiz status error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Get quiz history
// @route   GET /api/quiz/history
// @access  Private
const getQuizHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const userId = req.user._id;

    const [quizzes, total] = await Promise.all([
      UserQuiz.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      UserQuiz.countDocuments({ userId })
    ]);

    return successResponse(res, {
      quizzes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Quiz history retrieved successfully');

  } catch (error) {
    console.error('Get quiz history error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Debug quiz submission issues
// @route   GET /api/quiz/debug
// @access  Private
const debugQuizInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    console.log('=== Quiz Debug Info ===');
    console.log('User ID:', userId);
    console.log('User object:', {
      id: user._id,
      email: user.email,
      name: user.name,
      level: user.level,
      quizCompleted: user.quizCompleted,
      quizScore: user.quizScore,
      quizDate: user.quizDate,
      isActive: user.isActive
    });

    // Get user's quiz history
    const userQuizzes = await UserQuiz.find({ userId }).sort({ createdAt: -1 });
    console.log('User quiz history count:', userQuizzes.length);

    // Get available questions
    const questions = await Question.find({ isActive: true });
    console.log('Available questions count:', questions.length);

    // Check if user exists in database
    const userFromDb = await User.findById(userId);
    console.log('User from database:', {
      exists: !!userFromDb,
      id: userFromDb?._id,
      email: userFromDb?.email,
      quizCompleted: userFromDb?.quizCompleted,
      level: userFromDb?.level
    });

    const debugInfo = {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        level: user.level,
        quizCompleted: user.quizCompleted,
        quizScore: user.quizScore,
        quizDate: user.quizDate,
        isActive: user.isActive
      },
      database: {
        userExists: !!userFromDb,
        userQuizCount: userQuizzes.length,
        availableQuestions: questions.length,
        latestQuiz: userQuizzes.length > 0 ? {
          id: userQuizzes[0]._id,
          score: userQuizzes[0].score,
          totalQuestions: userQuizzes[0].totalQuestions,
          level: userQuizzes[0].assignedLevel,
          completedAt: userQuizzes[0].completedAt
        } : null
      },
      authentication: {
        tokenPresent: !!req.headers.authorization,
        userAuthenticated: !!req.user,
        userId: req.user?._id
      },
      system: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    return successResponse(res, debugInfo, 'Debug information retrieved successfully');

  } catch (error) {
    console.error('Debug quiz info error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Test database connection and UserQuiz model
// @route   GET /api/quiz/test-db
// @access  Private
const testDatabase = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('=== Database Test ===');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    console.log('User ID:', userId);
    
    // Test UserQuiz model
    const testQuizData = {
      userId,
      score: 1,
      totalQuestions: 1,
      correctAnswers: 1,
      timeSpent: 30,
      answers: [{
        questionId: '507f1f77bcf86cd799439011', // dummy ObjectId
        userAnswer: 'A',
        isCorrect: true,
        timeSpent: 30
      }],
      assignedLevel: 1
    };
    
    console.log('Creating test UserQuiz...');
    const testQuiz = await UserQuiz.create(testQuizData);
    console.log('Test UserQuiz created:', testQuiz._id);
    
    // Verify it was saved
    const foundQuiz = await UserQuiz.findById(testQuiz._id);
    console.log('Test UserQuiz found:', !!foundQuiz);
    
    // Count all UserQuiz records
    const totalCount = await UserQuiz.countDocuments({});
    console.log('Total UserQuiz records in database:', totalCount);
    
    // Clean up test record
    await UserQuiz.findByIdAndDelete(testQuiz._id);
    console.log('Test record cleaned up');
    
    return successResponse(res, {
      connectionState: mongoose.connection.readyState,
      databaseName: mongoose.connection.name,
      testPassed: true,
      totalUserQuizRecords: totalCount - 1 // Minus the test record we deleted
    }, 'Database test completed successfully');
    
  } catch (error) {
    console.error('Database test error:', error);
    return errorResponse(res, 'Database test failed: ' + error.message, 500);
  }
};

module.exports = {
  getQuestions,
  submitQuiz,
  getQuizStatus,
  getQuizHistory,
  debugQuizInfo,
  testDatabase
}; 