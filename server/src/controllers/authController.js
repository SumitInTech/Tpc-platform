const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/responseHelper');
const { logAudit } = require('../utils/auditLogger');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const getAllowedDomains = () => {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!raw) return [];
  return raw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
};

const emailDomain = (email) => (email.split('@')[1] || '').toLowerCase();

// Public self-signup — restricted to STUDENT role on an approved institute domain.
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const allowed = getAllowedDomains();
    if (allowed.length && !allowed.includes(emailDomain(email))) {
      throw new AppError(
        `Registration is limited to institute email addresses (${allowed.join(', ')}).`,
        403,
        'DOMAIN_NOT_ALLOWED'
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new AppError('Email already in use', 400, 'DUPLICATE_EMAIL');

    const user = await User.create({ name, email, passwordHash: password, role: 'STUDENT' });
    const token = generateToken(user._id);

    await logAudit({ userId: user._id, action: 'REGISTER', entityType: 'User', entityId: user._id, ipAddress: req.ip });

    sendSuccess(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Registration successful', 201);
  } catch (error) { next(error); }
};

// Privileged account provisioning — ADMIN only (TPC_OFFICER / ADMIN accounts).
exports.registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!['TPC_OFFICER', 'ADMIN'].includes(role)) {
      throw new AppError('Staff registration is limited to TPC_OFFICER and ADMIN roles', 400, 'INVALID_ROLE');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new AppError('Email already in use', 400, 'DUPLICATE_EMAIL');

    const user = await User.create({ name, email, passwordHash: password, role });
    const token = generateToken(user._id);

    await logAudit({ userId: req.user._id, action: 'REGISTER_STAFF', entityType: 'User', entityId: user._id, ipAddress: req.ip });

    sendSuccess(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Staff account created', 201);
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) throw new AppError('Invalid credentials or inactive account', 401, 'INVALID_CREDENTIALS');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    await logAudit({ userId: user._id, action: 'LOGIN', entityType: 'User', entityId: user._id, ipAddress: req.ip });

    sendSuccess(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
  } catch (error) { next(error); }
};

exports.me = async (req, res, next) => {
  try {
    sendSuccess(res, { user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  try {
    sendSuccess(res, {}, 'Logout successful');
  } catch (error) { next(error); }
};
