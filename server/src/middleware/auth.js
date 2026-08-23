const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');

module.exports = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return sendError(res, 'Not authorized to access this route', 'UNAUTHORIZED', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 'UNAUTHORIZED', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Not authorized to access this route', 'UNAUTHORIZED', 401);
  }
};
