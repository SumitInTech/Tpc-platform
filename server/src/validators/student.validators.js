const { body } = require('express-validator');

exports.createStudentValidator = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('cgpa').isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('graduationYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid graduation year required'),
  body('branch').notEmpty().withMessage('Branch is required')
];

exports.updateStudentValidator = [
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }).withMessage('Valid graduation year required')
];

exports.updateMyProfileValidator = [
  body('skills').optional().isArray().withMessage('Skills must be a list'),
  body('skills.*').optional().isString().withMessage('Each skill must be text'),
  body('phone').optional().isString().withMessage('Phone must be text'),
  body('branch').optional().isString().withMessage('Branch must be text'),
  body('department').optional().isString().withMessage('Department must be text'),
  body('batch').optional().isString().withMessage('Batch must be text'),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }).withMessage('Valid graduation year required'),
  body('backlogs').optional().isInt({ min: 0, max: 100 }).withMessage('Backlogs must be a non-negative number'),
  body('activeBacklogs').optional().isInt({ min: 0, max: 100 }).withMessage('Active backlogs must be a non-negative number')
];
