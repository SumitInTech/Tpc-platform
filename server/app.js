const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./src/middleware/errorHandler');
const { globalLimiter, authLimiter, writeLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Never let the browser/proxies cache API data - lists must always reflect the DB
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes (tiered rate limiting: global safety net -> login brute-force -> write abuse)
app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/students', writeLimiter, require('./src/routes/student.routes'));
app.use('/api/companies', writeLimiter, require('./src/routes/company.routes'));
app.use('/api/drives', writeLimiter, require('./src/routes/drive.routes'));
app.use('/api/applications', writeLimiter, require('./src/routes/application.routes'));
app.use('/api/offers', writeLimiter, require('./src/routes/offer.routes'));
app.use('/api/policies', writeLimiter, require('./src/routes/policy.routes'));
app.use('/api/placements', writeLimiter, require('./src/routes/placement.routes'));
app.use('/api/reports', require('./src/routes/report.routes'));
app.use('/api/audit-logs', require('./src/routes/audit.routes'));
app.use('/api/notifications', writeLimiter, require('./src/routes/notification.routes'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
