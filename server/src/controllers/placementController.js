const PlacementRecord = require('../models/PlacementRecord');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');

exports.getPlacements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, branch, academicYear, status } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const placements = await PlacementRecord.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('studentId', 'name studentId branch cgpa')
      .populate('companyId', 'name industry')
      .populate('driveId', 'title');
    
    const total = await PlacementRecord.countDocuments(query);
    sendPaginated(res, placements, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getPlacement = async (req, res, next) => {
  try {
    const placement = await PlacementRecord.findById(req.params.id).populate('studentId companyId driveId');
    if (!placement) throw new AppError('Placement record not found', 404, 'NOT_FOUND');
    sendSuccess(res, placement);
  } catch (error) { next(error); }
};

exports.createPlacement = async (req, res, next) => {
  try {
    const placement = await PlacementRecord.create(req.body);
    sendSuccess(res, placement, 'Placement record created', 201);
  } catch (error) { next(error); }
};

exports.updatePlacement = async (req, res, next) => {
  try {
    const placement = await PlacementRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!placement) throw new AppError('Placement record not found', 404, 'NOT_FOUND');
    sendSuccess(res, placement, 'Placement record updated');
  } catch (error) { next(error); }
};
