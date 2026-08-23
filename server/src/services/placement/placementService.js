const PlacementRecord = require('../../models/PlacementRecord');
const Offer = require('../../models/Offer');
const AppError = require('../../utils/AppError');

async function createFromOffer(offerId) {
  const offer = await Offer.findById(offerId).populate('studentId driveId');
  if (!offer || offer.status !== 'ACCEPTED') throw new AppError('Invalid offer', 400, 'INVALID_OFFER');

  const student = offer.studentId;
  const record = await PlacementRecord.create({
    studentId: student._id,
    companyId: offer.companyId,
    driveId: offer.driveId,
    offerId: offer._id,
    package: offer.package,
    currency: offer.currency,
    placementDate: new Date(),
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
    graduationYear: student.graduationYear,
    department: student.department,
    branch: student.branch
  });

  return record;
}

async function getPlacementStats(filters = {}) {
  const totalPlaced = await PlacementRecord.countDocuments(filters);
  const avgPkg = await PlacementRecord.aggregate([
    { $match: filters },
    { $group: { _id: null, avg: { $avg: '$package' }, max: { $max: '$package' } } }
  ]);
  return {
    totalPlaced,
    averagePackage: avgPkg[0]?.avg || 0,
    highestPackage: avgPkg[0]?.max || 0
  };
}

module.exports = { createFromOffer, getPlacementStats };
