const { sendError } = require('../utils/responseHelper');
const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors || [];

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map(val => val.message);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
    code = 'RESOURCE_NOT_FOUND';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    code = 'DUPLICATE_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'UNAUTHORIZED';
  }

  // Never send stack in production
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  sendError(res, message, code, statusCode, errors);
};
