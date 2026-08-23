const Drive = require('../models/Drive');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/responseHelper');
const { evaluateStudent } = require('../services/eligibility/eligibilityEngine');
const { evaluateStudentAction } = require('../services/policy/policyEngine');

exports.getMyEligibility = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const eligibility = await evaluateStudent(student, drive);
    const policyCheck = await evaluateStudentAction(student, 'APPLY', { drivePackage: drive.package });

    sendSuccess(res, { eligibility, policyCheck });
  } catch (error) { next(error); }
};

exports.evaluateStudentEligibility = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const drive = await Drive.findById(req.params.id);
    if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');

    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const eligibility = await evaluateStudent(student, drive);
    const policyCheck = await evaluateStudentAction(student, 'APPLY', { drivePackage: drive.package });

    sendSuccess(res, { eligibility, policyCheck });
  } catch (error) { next(error); }
};
