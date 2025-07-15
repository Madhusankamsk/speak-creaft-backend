const jwt = require('jsonwebtoken');
const { JWT_SECRET, ERROR_MESSAGES } = require('../utils/constants');
const User = require('../models/User');

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }
};

const requireQuizCompletion = async (req, res, next) => {
  try {
    if (!req.user.quizCompleted) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.QUIZ_NOT_COMPLETED
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

module.exports = {
  userAuth,
  requireQuizCompletion
}; 