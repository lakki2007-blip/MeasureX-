// Certificate Routes (Form VII Official Certificates)
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/auth');

// All certificate routes require JWT authentication
router.use(authenticateToken);

// GET /api/certificates - List certificates based on role context
router.get('/', certificateController.listCertificates);

// GET /api/certificates/:id - Fetch certificate details for logged-in user to view/print
router.get('/:id', certificateController.getCertificateById);

module.exports = router;
