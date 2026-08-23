const { body } = require('express-validator');

exports.createDriveValidator = [
  body('companyId').notEmpty().withMessage('Company ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('jobRole').notEmpty().withMessage('Job role is required'),
  body('jobType').isIn(['FULL_TIME', 'INTERN', 'CONTRACT']).withMessage('Invalid job type'),
  body('package').isFloat({ min: 0.1 }).withMessage('Package must be > 0'),
  body('driveDate').optional({ values: 'falsy' }).isISO8601(),
  body('applicationStart').optional({ values: 'falsy' }).isISO8601(),
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601(),
  body('location').optional({ values: 'falsy' }).isString(),
  body('description').optional({ values: 'falsy' }).isString(),
  body('graduationYears').optional().isArray(),
  body('eligibleBranches').optional().isArray(),
  body('eligibilityRules').optional().isObject()
];
