const PlacementRecord = require('../../models/PlacementRecord');
const Student = require('../../models/Student');
const Drive = require('../../models/Drive');
const Application = require('../../models/Application');
const Offer = require('../../models/Offer');
const Company = require('../../models/Company');

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function getOverview(filters = {}) {
  const totalStudents = await Student.countDocuments();
  const placedStudents = await Student.countDocuments({ placementStatus: 'PLACED' });
  const totalDrives = await Drive.countDocuments();
  const activeDrives = await Drive.countDocuments({ status: 'PUBLISHED' });
  const totalApplications = await Application.countDocuments();
  const offersData = await Offer.aggregate([{ $group: { _id: null, total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } } } }]);
  const pkgData = await PlacementRecord.aggregate([{ $group: { _id: null, avg: { $avg: '$package' }, max: { $max: '$package' }, pkgs: { $push: '$package' } } }]);
  const totalCompanies = await Company.countDocuments({ isActive: true });

  return {
    totalStudents,
    placedStudents,
    placementRate: totalStudents ? ((placedStudents/totalStudents)*100).toFixed(2) : 0,
    totalDrives, activeDrives, totalApplications,
    totalOffers: offersData[0]?.total || 0,
    acceptedOffers: offersData[0]?.accepted || 0,
    totalCompanies,
    averagePackage: pkgData[0]?.avg || 0,
    highestPackage: pkgData[0]?.max || 0,
    medianPackage: median(pkgData[0]?.pkgs || [])
  };
}

async function getBranchWise(filters = {}) {
  return await PlacementRecord.aggregate([
    { $match: filters },
    { $group: { _id: '$branch', count: { $sum: 1 }, avgPackage: { $avg: '$package' }, maxPackage: { $max: '$package' } } },
    { $sort: { _id: 1 } }
  ]);
}

async function getCompanyWise(filters = {}) {
  return await PlacementRecord.aggregate([
    { $match: filters },
    { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'company' } },
    { $unwind: '$company' },
    { $group: { _id: '$company.name', placements: { $sum: 1 }, avgPackage: { $avg: '$package' } } },
    { $sort: { placements: -1 } }
  ]);
}

async function getPackageDistribution(filters = {}) {
  return await PlacementRecord.aggregate([
    { $match: filters },
    { $bucket: {
        groupBy: '$package',
        boundaries: [0, 5, 10, 15, 20, 50],
        default: '20+',
        output: { count: { $sum: 1 } }
      }
    }
  ]);
}

async function getYearWise(filters = {}) {
  const match = {};
  if (filters.branch) match.branch = filters.branch;
  if (filters.academicYear) match.academicYear = filters.academicYear;
  return await PlacementRecord.aggregate([
    { $match: match },
    { $group: { _id: '$academicYear', placements: { $sum: 1 }, avgPackage: { $avg: '$package' } } },
    { $sort: { _id: 1 } }
  ]);
}

async function exportData(filters = {}) {
  const data = await PlacementRecord.find(filters).populate('studentId companyId driveId offerId').lean();
  return data.map(record => ({
    studentName: record.studentId.name,
    studentId: record.studentId.studentId,
    branch: record.studentId.branch,
    company: record.companyId.name,
    package: record.package,
    date: record.placementDate,
    academicYear: record.academicYear
  }));
}

async function getNIRFGO(filters = {}) {
  const totalStudents = await Student.countDocuments();
  const placedStudents = await Student.countDocuments({ placementStatus: 'PLACED' });

  const pkgAgg = await PlacementRecord.aggregate([
    { $match: filters },
    { $group: { _id: null, pkgs: { $push: '$package' } } }
  ]);
  const medianLPA = median(pkgAgg[0]?.pkgs || []);

  const outcomes = await Student.aggregate([
    { $match: { ...filters, placementStatus: { $ne: 'PLACED' } } },
    { $group: { _id: '$careerOutcome', count: { $sum: 1 } } }
  ]);
  const byOutcome = {};
  outcomes.forEach(o => { byOutcome[o._id || 'UNSPECIFIED'] = o.count; });

  const higherStudies = byOutcome['HIGHER_STUDIES'] || 0;
  const entrepreneurs = byOutcome['ENTREPRENEUR'] || 0;
  const phd = byOutcome['PHD'] || 0;
  const seekingEmployment = Math.max(0, totalStudents - placedStudents - higherStudies - entrepreneurs - phd);

  return {
    graduatingStudents: totalStudents,
    studentsPlaced: placedStudents,
    medianSalaryLPA: Number(medianLPA.toFixed(2)),
    medianSalaryINR: Math.round(medianLPA * 100000),
    higherStudies,
    entrepreneurs,
    phd,
    seekingEmployment
  };
}

async function exportNIRFGO(filters = {}) {
  const go = await getNIRFGO(filters);
  return [
    { metric: 'Number of students graduating', value: go.graduatingStudents },
    { metric: 'Number of students placed', value: go.studentsPlaced },
    { metric: 'Median salary of placed graduates (INR)', value: go.medianSalaryINR },
    { metric: 'Median salary of placed graduates (LPA)', value: go.medianSalaryLPA },
    { metric: 'Number of students opted for higher studies', value: go.higherStudies },
    { metric: 'Number of students entrepreneurial/self-employed', value: go.entrepreneurs },
    { metric: 'Number of students pursuing PhD', value: go.phd },
    { metric: 'Number of students seeking employment', value: go.seekingEmployment }
  ];
}

module.exports = { getOverview, getBranchWise, getCompanyWise, getPackageDistribution, getYearWise, exportData, getNIRFGO, exportNIRFGO };
