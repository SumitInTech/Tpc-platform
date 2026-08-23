const PlacementPolicy = require('../models/PlacementPolicy');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/responseHelper');
const { evaluateStudentAction } = require('../services/policy/policyEngine');
const Student = require('../models/Student');

exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await PlacementPolicy.find().sort({ createdAt: -1 });
    sendSuccess(res, policies);
  } catch (error) { next(error); }
};

exports.getPolicy = async (req, res, next) => {
  try {
    const policy = await PlacementPolicy.findById(req.params.id);
    if (!policy) throw new AppError('Policy not found', 404, 'NOT_FOUND');
    sendSuccess(res, policy);
  } catch (error) { next(error); }
};

exports.createPolicy = async (req, res, next) => {
  try {
    const policy = await PlacementPolicy.create({ ...req.body, createdBy: req.user._id });
    sendSuccess(res, policy, 'Policy created', 201);
  } catch (error) { next(error); }
};

exports.updatePolicy = async (req, res, next) => {
  try {
    const policy = await PlacementPolicy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!policy) throw new AppError('Policy not found', 404, 'NOT_FOUND');
    sendSuccess(res, policy, 'Policy updated');
  } catch (error) { next(error); }
};

exports.activatePolicy = async (req, res, next) => {
  try {
    const policy = await PlacementPolicy.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    sendSuccess(res, policy, 'Policy activated');
  } catch (error) { next(error); }
};

exports.deactivatePolicy = async (req, res, next) => {
  try {
    const policy = await PlacementPolicy.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    sendSuccess(res, policy, 'Policy deactivated');
  } catch (error) { next(error); }
};

exports.evaluatePolicy = async (req, res, next) => {
  try {
    const { studentId, action, context } = req.body;
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');
    
    const result = await evaluateStudentAction(student, action, context);
    sendSuccess(res, result);
  } catch (error) { next(error); }
};
