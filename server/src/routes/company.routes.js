const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.use(auth);

router.get('/', companyController.getCompanies);
router.get('/summary', companyController.getCompanySummary);
router.get('/:id', companyController.getCompany);
router.post('/', authorizeRole('TPC_OFFICER', 'ADMIN'), companyController.createCompany);
router.put('/:id', authorizeRole('TPC_OFFICER', 'ADMIN'), companyController.updateCompany);
router.delete('/:id', authorizeRole('ADMIN'), companyController.deleteCompany);

module.exports = router;
