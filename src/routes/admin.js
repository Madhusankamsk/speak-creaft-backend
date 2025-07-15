const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');
const { validateAdminLogin } = require('../middleware/validation');

// Admin authentication
router.post('/login', validateAdminLogin, adminController.adminLogin);

// Protected admin routes
router.use(adminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Admin profile
router.get('/profile', adminController.getAdminProfile);

module.exports = router; 