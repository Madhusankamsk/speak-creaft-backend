const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { userAuth } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

// All routes require authentication
router.use(userAuth);

// Get user notifications
router.get('/', validatePagination, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification settings
router.get('/settings', notificationController.getNotificationSettings);

// Update notification settings
router.put('/settings', notificationController.updateNotificationSettings);

// Mark notification as read
router.put('/:id/read', validateId, notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

// Delete specific notification
router.delete('/:id', validateId, notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router; 