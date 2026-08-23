const { sendError } = require('../utils/responseHelper');

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: Insufficient permissions', 'FORBIDDEN', 403);
    }
    next();
  };
};

module.exports = authorizeRole;
