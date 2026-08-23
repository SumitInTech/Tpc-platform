const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.use(auth);
router.use(authorizeRole('TPC_OFFICER', 'ADMIN'));

router.get('/overview', reportController.getOverview);
router.get('/branch-wise', reportController.getBranchWise);
router.get('/company-wise', reportController.getCompanyWise);
router.get('/package-distribution', reportController.getPackageDistribution);
router.get('/year-wise', reportController.getYearWise);
router.get('/export', reportController.exportReport);
router.get('/nirf-go', reportController.getNIRFGO);
router.get('/nirf-go-export', reportController.exportNIRFGO);

module.exports = router;
