const rateLimit = require('express-rate-limit');

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    code: 'RATE_LIMIT_EXCEEDED',
  });
};

const isWriteMethod = (req) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many requests from this IP. Please slow down and try again later.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many failed authentication attempts from this IP. Please try again after 15 minutes.'),
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (req) => !isWriteMethod(req),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many changes submitted from this IP. Please try again after 15 minutes.'),
});

const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many application attempts from this IP. Please try again after 15 minutes.'),
});

module.exports = { globalLimiter, authLimiter, writeLimiter, applyLimiter };
