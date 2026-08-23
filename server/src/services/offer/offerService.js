const mongoose = require('mongoose');
const Offer = require('../../models/Offer');
const Application = require('../../models/Application');
const Student = require('../../models/Student');
const PlacementRecord = require('../../models/PlacementRecord');
const Notification = require('../../models/Notification');
const AppError = require('../../utils/AppError');
const { evaluateStudentAction } = require('../policy/policyEngine');
const { logAudit } = require('../../utils/auditLogger');

async function createOffer(offerData, userId, ipAddress) {
  const application = await Application.findById(offerData.applicationId).populate('driveId studentId');
  if (!application) throw new AppError('Application not found', 404, 'NOT_FOUND');
  if (application.status !== 'SELECTED') throw new AppError('Student must be SELECTED to create an offer', 400, 'INVALID_STATUS');

  const student = application.studentId;
  const companyId = application.driveId.companyId;

  // Prevent a duplicate live offer for the same student + company + role.
  const existingOffer = await Offer.findOne({
    studentId: student._id,
    companyId,
    role: offerData.role,
    status: { $in: ['OFFERED', 'ACCEPTED'] },
  });
  if (existingOffer) {
    throw new AppError('An active offer already exists for this student at this company for the same role.', 409, 'DUPLICATE_OFFER');
  }

  const policyCheck = await evaluateStudentAction(student, 'RECEIVE_OFFER', { drivePackage: offerData.package });
  if (!policyCheck.allowed) throw new AppError(policyCheck.summary, 403, 'POLICY_BLOCKED');

  const offer = await Offer.create({
    applicationId: application._id,
    studentId: student._id,
    companyId: application.driveId.companyId,
    driveId: application.driveId._id,
    role: offerData.role,
    package: offerData.package,
    currency: offerData.currency || 'INR',
    offerDate: offerData.offerDate || new Date(),
    policyDecisionSnapshot: policyCheck,
    createdBy: userId
  });

  await logAudit({
    userId, action: 'CREATE_OFFER', entityType: 'Offer', entityId: offer._id,
    newValue: offer, ipAddress
  });

  await Notification.create({
    userId: student.userId, title: 'New Offer Received',
    message: `You have received an offer for ${offer.role} (${offer.package} LPA).`, type: 'SUCCESS'
  });

  return offer;
}

async function acceptOffer(offerId, studentUserId, userId, ipAddress) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const offer = await Offer.findById(offerId).populate('studentId driveId').session(session);
    if (!offer) throw new AppError('Offer not found', 404, 'NOT_FOUND');
    if (offer.status !== 'OFFERED') throw new AppError('Offer is not in a valid state to accept', 400, 'INVALID_STATUS');

    const student = offer.studentId;
    if (student.userId.toString() !== studentUserId.toString() && userId.toString() !== studentUserId.toString()) {
      // Allow if TPC is accepting on behalf, but basic check is fine for now
    }

    const policyCheck = await evaluateStudentAction(student, 'ACCEPT_OFFER', { drivePackage: offer.package });
    if (!policyCheck.allowed) throw new AppError(policyCheck.summary, 403, 'POLICY_BLOCKED');

    offer.status = 'ACCEPTED';
    offer.acceptedAt = new Date();
    await offer.save({ session });

    student.acceptedOffersCount += 1;
    if (offer.package > student.highestAcceptedPackage) {
      student.highestAcceptedPackage = offer.package;
    }
    student.placementStatus = 'PLACED';
    student.careerOutcome = 'PLACED';
    await student.save({ session });

    await PlacementRecord.create([{
      studentId: student._id, companyId: offer.companyId, driveId: offer.driveId, offerId: offer._id,
      package: offer.package, currency: offer.currency, placementDate: new Date(),
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
      graduationYear: student.graduationYear, department: student.department, branch: student.branch
    }], { session });

    await logAudit({ userId, action: 'ACCEPT_OFFER', entityType: 'Offer', entityId: offer._id, newValue: { status: 'ACCEPTED' }, ipAddress });
    await Notification.create([{ userId: student.userId, title: 'Offer Accepted', message: `You have accepted the offer for ${offer.role}.`, type: 'SUCCESS' }], { session });
    
    await session.commitTransaction();
    return offer;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function declineOffer(offerId, studentUserId, userId, ipAddress) {
  const offer = await Offer.findById(offerId).populate('studentId');
  if (!offer) throw new AppError('Offer not found', 404, 'NOT_FOUND');
  if (offer.status !== 'OFFERED') throw new AppError('Cannot decline this offer', 400, 'INVALID_STATUS');

  offer.status = 'DECLINED';
  offer.declinedAt = new Date();
  await offer.save();

  await logAudit({ userId, action: 'DECLINE_OFFER', entityType: 'Offer', entityId: offer._id, newValue: { status: 'DECLINED' }, ipAddress });
  return offer;
}

async function withdrawOffer(offerId, userId, ipAddress) {
  const offer = await Offer.findById(offerId).populate('studentId');
  if (!offer) throw new AppError('Offer not found', 404, 'NOT_FOUND');
  if (offer.status !== 'OFFERED') throw new AppError('Only an offered (un-accepted) offer can be withdrawn', 400, 'INVALID_STATUS');

  offer.status = 'WITHDRAWN';
  await offer.save();

  await logAudit({
    userId, action: 'WITHDRAW_OFFER', entityType: 'Offer', entityId: offer._id,
    newValue: { status: 'WITHDRAWN' }, ipAddress
  });

  return offer;
}

async function revokeOffer(offerId, userId, ipAddress) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const offer = await Offer.findById(offerId).populate('studentId').session(session);
    if (!offer) throw new AppError('Offer not found', 404, 'NOT_FOUND');
    if (offer.status !== 'ACCEPTED') throw new AppError('Only an accepted offer can be revoked', 400, 'INVALID_STATUS');

    const student = offer.studentId;

    // Reverse the placement record created on acceptance.
    await PlacementRecord.deleteOne({ offerId: offer._id }, { session });

    // Recompute the student's placement state from any remaining accepted offers.
    const otherAccepted = await Offer.find(
      { studentId: student._id, status: 'ACCEPTED', _id: { $ne: offer._id } },
      null,
      { session }
    );
    student.acceptedOffersCount = otherAccepted.length;
    if (otherAccepted.length > 0) {
      student.highestAcceptedPackage = Math.max(...otherAccepted.map((o) => o.package || 0));
      student.placementStatus = 'PLACED';
      student.careerOutcome = 'PLACED';
    } else {
      student.placementStatus = 'UNPLACED';
      student.careerOutcome = null;
      student.highestAcceptedPackage = 0;
    }
    await student.save({ session });

    offer.status = 'WITHDRAWN';
    offer.acceptedAt = null;
    await offer.save({ session });

    await logAudit({
      userId, action: 'REVOKE_OFFER', entityType: 'Offer', entityId: offer._id,
      newValue: { status: 'WITHDRAWN' }, ipAddress
    });

    await session.commitTransaction();
    return offer;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { createOffer, acceptOffer, declineOffer, withdrawOffer, revokeOffer };
