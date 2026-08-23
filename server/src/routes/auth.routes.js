const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidator, registerValidator, registerStaffValidator } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');

router.post('/register', registerValidator, validate, authController.register);
router.post('/register/staff', auth, authorizeRole('ADMIN'), registerStaffValidator, validate, authController.registerStaff);
router.post('/login', loginValidator, validate, authController.login);
router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);

module.exports = router;
