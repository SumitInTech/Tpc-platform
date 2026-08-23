const Drive = require('../models/Drive');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');

exports.getDrives = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, company, branch } = req.query;
    const query = {};
    if (status) query.status = status;
    if (company) query.companyId = company;
    if (branch) query.eligibleBranches = branch;

    if (req.user.role === 'STUDENT') {
      query.status = 'PUBLISHED';
      query.applicationDeadline = { $gte: new Date() };
    }

    const drives = await Drive.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('companyId', 'name logoUrl industry');
    
    const total = await Drive.countDocuments(query);
    sendPaginated(res, drives, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getDriveSummary = async (req, res, next) => {
  try {
    const { status, company, branch } = req.query;
    const match = {};
    if (status) match.status = status;
    if (company) match.companyId = company;
    if (branch) match.eligibleBranches = branch;

    const byStatus = await Drive.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = {};
    byStatus.forEach((s) => { counts[s._id] = s.count; });

    const total = await Drive.countDocuments(match);
    sendSuccess(res, {
      total,
      published: counts['PUBLISHED'] || 0,
      draft: counts['DRAFT'] || 0,
      closed: counts['CLOSED'] || 0,
      completed: counts['COMPLETED'] || 0,
      cancelled: counts['CANCELLED'] || 0,
    });
  } catch (error) { next(error); }
};

exports.getDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id).populate('companyId');
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
    
    if (req.user.role === 'STUDENT' && drive.status !== 'PUBLISHED') {
      throw new AppError('Drive not available', 403, 'FORBIDDEN');
    }
    
    sendSuccess(res, drive);
  } catch (error) { next(error); }
};

function sanitizeDriveBody(body = {}) {
  const clean = { ...body };
  ['applicationStart', 'applicationDeadline', 'driveDate'].forEach((f) => {
    if (clean[f] === '' || clean[f] === null || clean[f] === undefined) delete clean[f];
  });
  if (!Array.isArray(clean.graduationYears)) delete clean.graduationYears;
  if (!Array.isArray(clean.eligibleBranches)) delete clean.eligibleBranches;
  return clean;
}

exports.createDrive = async (req, res, next) => {
  try {
    const drive = await Drive.create({ ...sanitizeDriveBody(req.body), createdBy: req.user._id });
    sendSuccess(res, drive, 'Drive created', 201);
  } catch (error) { next(error); }
};

exports.updateDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findByIdAndUpdate(req.params.id, sanitizeDriveBody(req.body), { new: true, runValidators: true });
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
    sendSuccess(res, drive, 'Drive updated');
  } catch (error) { next(error); }
};

exports.publishDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findByIdAndUpdate(req.params.id, { status: 'PUBLISHED', publishedAt: new Date() }, { new: true });
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
    sendSuccess(res, drive, 'Drive published');
  } catch (error) { next(error); }
};

exports.closeDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findByIdAndUpdate(req.params.id, { status: 'CLOSED', closedAt: new Date() }, { new: true });
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
    sendSuccess(res, drive, 'Drive closed');
  } catch (error) { next(error); }
};

exports.deleteDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.id);
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
    sendSuccess(res, {}, 'Drive deleted');
  } catch (error) { next(error); }
};
