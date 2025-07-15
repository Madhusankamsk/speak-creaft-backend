const express = require('express');
const router = express.Router();
const { 
  getQuestions, 
  submitQuiz, 
  getQuizStatus, 
  getQuizHistory 
} = require('../controllers/quizController');
const { 
  validateQuizSubmission, 
  validatePagination 
} = require('../middleware/validation');
const { userAuth } = require('../middleware/auth');

// Public routes
router.get('/questions', getQuestions);
router.post('/submit', validateQuizSubmission, submitQuiz);

// Protected routes
router.get('/status', userAuth, getQuizStatus);
router.get('/history', userAuth, validatePagination, getQuizHistory);

module.exports = router; 