const Application = require('../models/Application');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');
const { applyToDrive, updateApplicationStatus } = require('../services/application/applicationService');

exports.getApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, driveId, studentId, status } = req.query;
    const query = {};
    if (driveId) query.driveId = driveId;
    if (status) query.status = status;

    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');
      query.studentId = student._id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({ path: 'driveId', select: 'title jobRole companyId package', populate: { path: 'companyId', select: 'name industry' } })
      .populate('studentId', 'name email studentId branch cgpa')
      .select('-resume');
    
    const total = await Application.countDocuments(query);
    sendPaginated(res, applications, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'driveId', populate: { path: 'companyId' } })
      .populate('studentId');
    if (!application) throw new AppError('Application not found', 404, 'NOT_FOUND');
    sendSuccess(res, application);
  } catch (error) { next(error); }
};

exports.applyToDrive = async (req, res, next) => {
  try {
    const cleanSkills = (v) => (Array.isArray(v) ? v.map((s) => String(s).trim().slice(0, 60)).filter(Boolean).slice(0, 40) : []);
    const extra = {
      resume: req.body.resume,
      resumeName: req.body.resumeName,
      whyThisRole: req.body.whyThisRole,
      highlightedSkills: cleanSkills(req.body.highlightedSkills),
      newSkills: cleanSkills(req.body.newSkills),
    };
    if (extra.resume && extra.resume.length > 8000000) {
      throw new AppError('Resume file is too large (max ~6MB).', 413, 'FILE_TOO_LARGE');
    }
    const application = await applyToDrive(req.user._id, req.params.id, req.user._id, req.ip, extra);
    sendSuccess(res, application, 'Successfully applied to drive', 201);
  } catch (error) { next(error); }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const application = await updateApplicationStatus(req.params.id, status, req.user._id, remarks, req.ip);
    sendSuccess(res, application, `Application status updated to ${status}`);
  } catch (error) { next(error); }
};
