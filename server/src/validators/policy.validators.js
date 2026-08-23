const { body } = require('express-validator');

const POLICY_TYPES = [
  'MAX_ACCEPTED_OFFERS',
  'MAX_TOTAL_OFFERS',
  'PLACED_STUDENT_RESTRICTION',
  'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION',
  'BRANCH_SPECIFIC_RESTRICTION',
];

exports.createPolicyValidator = [
  body('name').notEmpty().withMessage('Policy name is required').bail()
    .isLength({ min: 3 }).withMessage('Policy name must be at least 3 characters'),
  body('type').isIn(POLICY_TYPES).withMessage('Invalid policy type'),
  body('configuration').optional().isObject().withMessage('Configuration must be an object'),
  body('configuration.maximum').optional().isFloat({ min: 1 }).withMessage('Maximum must be >= 1'),
  body('configuration.minimumPackage').optional().isFloat({ min: 0 }).withMessage('Minimum package must be >= 0'),
  body('configuration.branches').optional().isArray({ min: 1 }).withMessage('At least one branch is required'),
  body('scope').optional().isIn(['INSTITUTION', 'BRANCH', 'DEPARTMENT']).withMessage('Invalid scope'),
  body('effectiveFrom').optional().isISO8601().withMessage('effectiveFrom must be a valid date')
];
