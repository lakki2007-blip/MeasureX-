// Verification Requests & Status Tracking Routes
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/requests/track/:id - Return the step-by-step status timeline for Amazon-style tracker
// (Accessible publicly or with token so traders and QR scanners can track anywhere)
router.get('/track/:id', requestController.trackRequestStatus);

// All subsequent request routes require JWT authentication
router.use(authenticateToken);

// POST /api/requests - Submit a verification booking (Trader only or Admin)
router.post('/', authorizeRoles('trader', 'admin'), requestController.createRequest);

// GET /api/requests - List requests based on role context
router.get('/', requestController.getRequests);

// PUT /api/requests/:id/assign - Assign an inspector to request (Admin only)
router.put('/:id/assign', authorizeRoles('admin'), requestController.assignInspector);

module.exports = router;
