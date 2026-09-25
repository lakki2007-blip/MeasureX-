// Public Verification Routes (Unauthenticated QR Code Scans)
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/public/access/:id - Public unauthenticated endpoint for external QR code scanning
router.get('/access/:id', publicController.verifyPublicQRCode);

module.exports = router;
