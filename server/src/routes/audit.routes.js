const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.use(auth);
router.use(authorizeRole('ADMIN'));

router.get('/stats', auditController.getAuditStats);
router.get('/', auditController.getAuditLogs);

module.exports = router;
