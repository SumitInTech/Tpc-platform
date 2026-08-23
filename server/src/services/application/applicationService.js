const Application = require('../../models/Application');
const Drive = require('../../models/Drive');
const Student = require('../../models/Student');
const Notification = require('../../models/Notification');
const AppError = require('../../utils/AppError');
const { evaluateStudent } = require('../eligibility/eligibilityEngine');
const { evaluateStudentAction } = require('../policy/policyEngine');
const { logAudit } = require('../../utils/auditLogger');

const VALID_TRANSITIONS = {
  APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: ['REJECTED'],
  REJECTED: [],
  WITHDRAWN: []
};

function validateStatusTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400, 'INVALID_TRANSITION');
  }
}

async function applyToDrive(studentId, driveId, userId, ipAddress, extra = {}) {
  const drive = await Drive.findById(driveId);
  if (!drive) throw new AppError('Drive not found', 404, 'NOT_FOUND');
  if (drive.status !== 'PUBLISHED') throw new AppError('Drive is not accepting applications', 400, 'DRIVE_NOT_PUBLISHED');
  if (drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline)) {
    throw new AppError('Application deadline has passed', 400, 'DEADLINE_PASSED');
  }

  const student = await Student.findOne({ userId: studentId }).populate('userId');
  if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

  const existingApp = await Application.findOne({ driveId, studentId: student._id });
  if (existingApp) throw new AppError('Already applied to this drive', 400, 'DUPLICATE_APPLICATION');

  const eligibility = await evaluateStudent(student, drive);
  if (!eligibility.eligible) {
    throw new AppError('Student does not meet eligibility criteria', 400, 'NOT_ELIGIBLE');
  }

  const policyCheck = await evaluateStudentAction(student, 'APPLY', { drivePackage: drive.package });
  if (!policyCheck.allowed) {
    throw new AppError(policyCheck.summary, 403, 'POLICY_BLOCKED');
  }

  const newSkills = Array.isArray(extra.newSkills) ? extra.newSkills : [];
  if (newSkills.length) {
    const merged = new Set([...(student.skills || []), ...newSkills]);
    student.skills = [...merged];
    await student.save();
    await logAudit({
      userId, action: 'UPDATE_STUDENT_SKILLS', entityType: 'Student', entityId: student._id,
      newValue: { added: newSkills }, ipAddress
    });
  }
  const highlightedSkills = Array.isArray(extra.highlightedSkills) && extra.highlightedSkills.length
    ? extra.highlightedSkills
    : (student.skills || []);

  const application = await Application.create({
    driveId,
    studentId: student._id,
    eligibilitySnapshot: eligibility,
    resume: extra.resume || undefined,
    resumeName: extra.resumeName || undefined,
    whyThisRole: extra.whyThisRole || undefined,
    highlightedSkills,
    statusHistory: [{ status: 'APPLIED', changedBy: userId }]
  });

  await logAudit({
    userId, action: 'APPLY_DRIVE', entityType: 'Application', entityId: application._id,
    newValue: { status: 'APPLIED' }, ipAddress
  });

  return application;
}

async function updateApplicationStatus(applicationId, newStatus, userId, remarks, ipAddress) {
  const application = await Application.findById(applicationId).populate('studentId driveId');
  if (!application) throw new AppError('Application not found', 404, 'NOT_FOUND');

  validateStatusTransition(application.status, newStatus);
  const oldStatus = application.status;
  
  application.status = newStatus;
  if (newStatus === 'SHORTLISTED') application.shortlistedAt = new Date();
  if (newStatus === 'INTERVIEW') application.interviewAt = new Date();
  if (newStatus === 'SELECTED') application.selectedAt = new Date();
  if (newStatus === 'REJECTED') application.rejectedAt = new Date();
  if (remarks) application.remarks = remarks;

  application.statusHistory.push({ status: newStatus, changedBy: userId, remarks });
  await application.save();

  await logAudit({
    userId, action: 'UPDATE_APPLICATION_STATUS', entityType: 'Application', entityId: application._id,
    oldValue: { status: oldStatus }, newValue: { status: newStatus }, ipAddress
  });

  await Notification.create({
    userId: application.studentId.userId,
    title: `Application Update: ${application.driveId.companyId?.name || 'Company'}`,
    message: `Your application status for ${application.driveId.title} has been updated to ${newStatus}.`,
    type: newStatus === 'SELECTED' ? 'SUCCESS' : newStatus === 'REJECTED' ? 'DANGER' : 'INFO'
  });

  return application;
}

module.exports = { validateStatusTransition, applyToDrive, updateApplicationStatus };
