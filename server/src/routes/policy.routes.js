const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { createPolicyValidator } = require('../validators/policy.validators');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');
const validate = require('../middleware/validate');

router.use(auth);
router.use(authorizeRole('TPC_OFFICER', 'ADMIN'));

router.get('/', policyController.getPolicies);
router.get('/:id', policyController.getPolicy);
router.post('/', createPolicyValidator, validate, policyController.createPolicy);
router.put('/:id', policyController.updatePolicy);
router.post('/:id/activate', policyController.activatePolicy);
router.post('/:id/deactivate', policyController.deactivatePolicy);
router.post('/evaluate', policyController.evaluatePolicy);

module.exports = router;
