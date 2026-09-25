// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Register user and return JWT
router.post('/register', authController.register);

// POST /api/auth/login - Verify credentials and return JWT
router.post('/login', authController.login);

// GET /api/auth/me - Get current logged-in user profile
router.get('/me', authenticateToken, authController.getProfile);

// GET /api/auth/users - List all registered users
router.get('/users', authController.getUsers);

module.exports = router;
