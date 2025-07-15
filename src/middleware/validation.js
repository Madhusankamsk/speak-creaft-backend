const { body, param, query, validationResult } = require('express-validator');
const { isValidEmail, isValidPassword } = require('../utils/helpers');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom(isValidEmail)
    .withMessage('Email format is invalid'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom(isValidPassword)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Admin login validation
const validateAdminLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom(isValidEmail)
    .withMessage('Email format is invalid'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  
  handleValidationErrors
];

// Quiz submission validation
const validateQuizSubmission = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be an array with at least one answer'),
  
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Each answer must have a valid question ID'),
  
  body('answers.*.selectedOption')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Selected option must be A, B, C, or D'),
  
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive integer'),
  
  handleValidationErrors
];

// Tip interaction validation
const validateTipInteraction = [
  param('tipId')
    .isMongoId()
    .withMessage('Invalid tip ID'),
  
  body('action')
    .isIn(['read', 'favorite', 'unfavorite'])
    .withMessage('Action must be read, favorite, or unfavorite'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  handleValidationErrors
];

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  
  handleValidationErrors
];

// Question validation
const validateQuestion = [
  body('text')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Question text must be between 10 and 500 characters'),
  
  body('options')
    .isArray({ min: 2, max: 4 })
    .withMessage('Question must have between 2 and 4 options'),
  
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each option must be between 1 and 200 characters'),
  
  body('correctAnswer')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Correct answer must be A, B, C, or D'),
  
  body('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('level')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10'),
  
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Explanation must be less than 300 characters'),
  
  handleValidationErrors
];

// Tip validation
const validateTip = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tip title must be between 5 and 100 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Tip content must be between 10 and 1000 characters'),
  
  body('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('level')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters'),
  
  handleValidationErrors
];

// User management validation
const validateUserUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('level')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1 and 10'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validateProfileUpdate,
  validateQuizSubmission,
  validateTipInteraction,
  validatePagination,
  validateSearch,
  validateCategory,
  validateQuestion,
  validateTip,
  validateUserUpdate,
  validateId
}; 