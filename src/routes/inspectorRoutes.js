// Inspector Workbench Routes
const express = require('express');
const router = express.Router();
const inspectorController = require('../controllers/inspectorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All inspector routes require JWT authentication and inspector/admin role
router.use(authenticateToken);
router.use(authorizeRoles('inspector', 'admin'));

// POST /api/inspector/testbench - Submit test readings, verify MPE tolerances, update instrument status, and issue Certificate
router.post('/testbench', inspectorController.submitTestBench);

// GET /api/inspector/tasks - List assigned inspection tasks
router.get('/tasks', inspectorController.getInspectorTasks);

module.exports = router;
