const Question = require('../models/Question');
const UserQuiz = require('../models/UserQuiz');
const User = require('../models/User');
const { successResponse, errorResponse, getPaginationParams } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, USER_LEVELS } = require('../utils/constants');

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
// @access  Public
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user ? req.user._id : null;

    // Get all questions
    const questions = await Question.find({ isActive: true });
    
    if (questions.length === 0) {
      return errorResponse(res, 'No questions available', 400);
    }

    // Calculate results
    let correctAnswers = 0;
    let totalTimeSpent = 0;
    const detailedAnswers = [];

    for (const answer of answers) {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      
      if (!question) {
        continue;
      }

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

    // Calculate level
    const level = calculateLevel(correctAnswers, questions.length);

    // Save quiz results if user is authenticated
    if (userId) {
      const userQuiz = await UserQuiz.create({
        userId,
        score: correctAnswers,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpent: totalTimeSpent,
        answers: detailedAnswers,
        assignedLevel: level
      });

      // Update user
      await User.findByIdAndUpdate(userId, {
        level,
        quizCompleted: true,
        quizScore: correctAnswers,
        quizDate: new Date()
      });
    }

    return successResponse(res, {
      score: correctAnswers,
      totalQuestions: questions.length,
      level,
      levelName: getLevelName(level),
      timeSpent: totalTimeSpent,
      answers: detailedAnswers
    }, SUCCESS_MESSAGES.QUIZ_SUBMITTED);

  } catch (error) {
    console.error('Submit quiz error:', error);
    return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
};

// @desc    Check quiz status
// @route   GET /api/quiz/status
// @access  Private
const getQuizStatus = async (req, res) => {
  try {
    const user = req.user;

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

module.exports = {
  getQuestions,
  submitQuiz,
  getQuizStatus,
  getQuizHistory
}; 