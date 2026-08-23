const Offer = require('../models/Offer');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');
const { createOffer, acceptOffer, declineOffer, withdrawOffer, revokeOffer } = require('../services/offer/offerService');
const Student = require('../models/Student');

exports.getOffers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, companyId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;

    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user._id });
      query.studentId = student._id;
    }

    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('companyId', 'name')
      .populate('studentId', 'name studentId')
      .populate('driveId', 'title');
    
    const total = await Offer.countDocuments(query);
    sendPaginated(res, offers, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('companyId driveId studentId');
    if (!offer) throw new AppError('Offer not found', 404, 'NOT_FOUND');
    sendSuccess(res, offer);
  } catch (error) { next(error); }
};

exports.createOffer = async (req, res, next) => {
  try {
    const offer = await createOffer(req.body, req.user._id, req.ip);
    sendSuccess(res, offer, 'Offer created', 201);
  } catch (error) { next(error); }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const offer = await acceptOffer(req.params.id, req.user._id, req.user._id, req.ip);
    sendSuccess(res, offer, 'Offer accepted successfully');
  } catch (error) { next(error); }
};

exports.declineOffer = async (req, res, next) => {
  try {
    const offer = await declineOffer(req.params.id, req.user._id, req.user._id, req.ip);
    sendSuccess(res, offer, 'Offer declined');
  } catch (error) { next(error); }
};

exports.withdrawOffer = async (req, res, next) => {
  try {
    const offer = await withdrawOffer(req.params.id, req.user._id, req.ip);
    sendSuccess(res, offer, 'Offer withdrawn');
  } catch (error) { next(error); }
};

exports.revokeOffer = async (req, res, next) => {
  try {
    const offer = await revokeOffer(req.params.id, req.user._id, req.ip);
    sendSuccess(res, offer, 'Offer revoked and placement reversed');
  } catch (error) { next(error); }
};
