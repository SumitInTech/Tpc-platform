const Student = require('../models/Student');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');
const { logAudit } = require('../utils/auditLogger');

const DEFAULT_STUDENT_PASSWORD = 'Student@123';

exports.getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, branch, graduationYear, placementStatus } = req.query;
    const query = {};
    if (search) query.name = new RegExp(search, 'i');
    if (branch) query.branch = branch;
    if (graduationYear) query.graduationYear = graduationYear;
    if (placementStatus) query.placementStatus = placementStatus;

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('userId', 'name email isActive');
    
    const total = await Student.countDocuments(query);
    sendPaginated(res, students, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email isActive');
    if (!student) throw new AppError('Student profile not found. Contact the placement cell.', 404, 'NOT_FOUND');
    sendSuccess(res, student);
  } catch (error) { next(error); }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email isActive');
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');
    
    if (req.user.role === 'STUDENT' && student.userId._id.toString() !== req.user._id.toString()) {
      throw new AppError('Unauthorized access to student profile', 403, 'FORBIDDEN');
    }
    
    sendSuccess(res, student);
  } catch (error) { next(error); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, ...studentFields } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new AppError('A user account with this email already exists', 409, 'DUPLICATE_EMAIL');

    const user = await User.create({
      name: name || studentFields.studentId,
      email,
      passwordHash: password || DEFAULT_STUDENT_PASSWORD,
      role: 'STUDENT',
    });

    const student = await Student.create({
      ...studentFields,
      name: name || studentFields.studentId,
      email,
      userId: user._id,
    });

    sendSuccess(res, { ...student.toObject(), loginEmail: email, defaultPassword: password ? undefined : DEFAULT_STUDENT_PASSWORD }, 'Student created with login account', 201);
  } catch (error) { next(error); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, ...studentFields } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, { ...studentFields, ...(name ? { name } : {}), ...(email ? { email } : {}) }, { new: true, runValidators: true });
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = email;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(student.userId, userUpdate, { runValidators: true }).catch(() => {});
    }

    sendSuccess(res, student, 'Student updated');
  } catch (error) { next(error); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');
    sendSuccess(res, {}, 'Student deleted');
  } catch (error) { next(error); }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const { skills, phone, branch, department, batch, graduationYear, backlogs, activeBacklogs } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

    const updates = {};
    if (Array.isArray(skills)) {
      updates.skills = skills.map((s) => String(s).trim().slice(0, 60)).filter(Boolean).slice(0, 40);
    }
    if (typeof phone === 'string' && phone.trim()) updates.phone = phone.trim().slice(0, 20);
    if (typeof branch === 'string' && branch.trim()) updates.branch = branch.trim().slice(0, 40);
    if (typeof department === 'string') updates.department = department.trim().slice(0, 60);
    if (typeof batch === 'string' && batch.trim()) updates.batch = batch.trim().slice(0, 20);
    if (graduationYear != null && graduationYear !== '') updates.graduationYear = Number(graduationYear);
    if (backlogs != null && backlogs !== '') updates.backlogs = Number(backlogs);
    if (activeBacklogs != null && activeBacklogs !== '') updates.activeBacklogs = Number(activeBacklogs);

    const updated = await Student.findByIdAndUpdate(student._id, updates, { new: true, runValidators: true });

    if (Array.isArray(skills)) {
      await logAudit({
        userId: req.user._id, action: 'UPDATE_STUDENT_SKILLS', entityType: 'Student', entityId: student._id,
        newValue: { skills: updates.skills }, ipAddress: req.ip
      });
    }

    const academic = {};
    ['branch', 'department', 'batch', 'graduationYear', 'backlogs', 'activeBacklogs'].forEach((k) => {
      if (updates[k] !== undefined) academic[k] = updates[k];
    });
    if (Object.keys(academic).length) {
      await logAudit({
        userId: req.user._id, action: 'UPDATE_STUDENT_PROFILE', entityType: 'Student', entityId: student._id,
        newValue: academic, ipAddress: req.ip
      });
    }

    sendSuccess(res, updated, 'Profile updated');
  } catch (error) { next(error); }
};
