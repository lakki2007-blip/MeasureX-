// Instruments Routes
const express = require('express');
const router = express.Router();
const instrumentController = require('../controllers/instrumentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All instrument routes require JWT authentication
router.use(authenticateToken);

// POST /api/instruments - Register a new instrument (Trader only or Admin)
router.post('/', authorizeRoles('trader', 'admin'), instrumentController.registerInstrument);

// GET /api/instruments - List instruments (Traders see their own; Admins/Inspectors see all)
router.get('/', instrumentController.getInstruments);

// GET /api/instruments/:id - Fetch single instrument details
router.get('/:id', instrumentController.getInstrumentById);

module.exports = router;
