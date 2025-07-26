const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');
const { validateAdminLogin } = require('../middleware/validation');

// Admin authentication
router.post('/login', validateAdminLogin, adminController.adminLogin);
router.post('/register', adminController.createAdmin);
router.post('/logout', adminController.adminLogout);
router.get('/verify', adminAuth, adminController.verifyToken);

// Protected admin routes
router.use(adminAuth);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/activity', adminController.getRecentActivity);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Question management
router.get('/questions', adminController.getQuestions);
router.get('/questions/:id', adminController.getQuestion);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.patch('/questions/:id/toggle-status', adminController.toggleQuestionStatus);

// Tip management
router.get('/tips', adminController.getTips);
router.get('/tips/:id', adminController.getTip);
router.post('/tips', adminController.createTip);
router.put('/tips/:id', adminController.updateTip);
router.delete('/tips/:id', adminController.deleteTip);
router.patch('/tips/:id/toggle-status', adminController.toggleTipStatus);

// Category management
router.get('/categories', adminController.getCategories);
router.get('/categories/:id', adminController.getCategory);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Quiz results
router.get('/quiz-results', adminController.getQuizResults);
router.get('/quiz-results/:id', adminController.getQuizResult);
router.delete('/quiz-results/:id', adminController.deleteQuizResult);

// Notifications
router.get('/notifications', adminController.getNotifications);
router.get('/notifications/stats', adminController.getNotificationStats);
router.post('/notifications', adminController.sendNotification);
router.delete('/notifications/:id', adminController.deleteNotification);
router.patch('/notifications/:id/read', adminController.markNotificationAsRead);
router.patch('/notifications/read-all', adminController.markAllNotificationsAsRead);

// Analytics
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/user-growth', adminController.getUserGrowth);
router.get('/analytics/quiz-performance', adminController.getQuizPerformance);
router.get('/analytics/level-distribution', adminController.getLevelDistribution);
router.get('/analytics/daily-active-users', adminController.getDailyActiveUsers);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// File upload
router.post('/upload', adminController.uploadFile);

// Admin profile
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);

module.exports = router; 