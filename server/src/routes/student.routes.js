const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/role');
const { createStudentValidator, updateStudentValidator, updateMyProfileValidator } = require('../validators/student.validators');
const validate = require('../middleware/validate');

router.use(auth);

router.get('/', authorizeRole('TPC_OFFICER', 'ADMIN'), studentController.getStudents);
router.get('/me', authorizeRole('STUDENT'), studentController.getMyProfile);
router.put('/me', authorizeRole('STUDENT'), updateMyProfileValidator, validate, studentController.updateMyProfile);
router.get('/:id', studentController.getStudent);
router.post('/', authorizeRole('TPC_OFFICER', 'ADMIN'), createStudentValidator, validate, studentController.createStudent);
router.put('/:id', authorizeRole('TPC_OFFICER', 'ADMIN'), updateStudentValidator, validate, studentController.updateStudent);
router.delete('/:id', authorizeRole('ADMIN'), studentController.deleteStudent);

module.exports = router;
