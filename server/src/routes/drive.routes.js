const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const eligibilityController = require('../controllers/eligibilityController');
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');
const { createDriveValidator } = require('../validators/drive.validators');
const validate = require('../middleware/validate');

router.use(auth);

router.get('/', driveController.getDrives);
router.get('/summary', driveController.getDriveSummary);
router.get('/:id', driveController.getDrive);

router.post('/', authorizeRole('TPC_OFFICER', 'ADMIN'), createDriveValidator, validate, driveController.createDrive);
router.put('/:id', authorizeRole('TPC_OFFICER', 'ADMIN'), driveController.updateDrive);
router.post('/:id/publish', authorizeRole('TPC_OFFICER', 'ADMIN'), driveController.publishDrive);
router.post('/:id/close', authorizeRole('TPC_OFFICER', 'ADMIN'), driveController.closeDrive);
router.post('/:id/reopen', authorizeRole('TPC_OFFICER', 'ADMIN'), driveController.reopenDrive);
router.delete('/:id', authorizeRole('ADMIN'), driveController.deleteDrive);

router.get('/:id/eligibility', authorizeRole('STUDENT'), eligibilityController.getMyEligibility);
router.post('/:id/apply', authorizeRole('STUDENT'), applicationController.applyToDrive);
router.post('/:id/eligibility/evaluate', authorizeRole('TPC_OFFICER', 'ADMIN'), eligibilityController.evaluateStudentEligibility);

module.exports = router;
