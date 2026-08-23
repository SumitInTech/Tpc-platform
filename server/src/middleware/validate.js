const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHelper');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return sendError(res, 'Validation Error', 'VALIDATION_ERROR', 422, errorMessages);
  }
  next();
};
