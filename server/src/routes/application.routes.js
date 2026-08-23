const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');
const { applyLimiter } = require('../middleware/rateLimiter');

router.use(auth);

router.get('/', applicationController.getApplications);
router.get('/:id', applicationController.getApplication);
router.post('/drive/:id/apply', applyLimiter, authorizeRole('STUDENT'), applicationController.applyToDrive);
router.patch('/:id/status', authorizeRole('TPC_OFFICER', 'ADMIN'), applicationController.updateApplicationStatus);

module.exports = router;
