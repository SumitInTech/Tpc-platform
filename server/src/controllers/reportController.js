const reportService = require('../services/report/reportService');
const { sendSuccess } = require('../utils/responseHelper');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await reportService.getOverview(req.query);
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.getBranchWise = async (req, res, next) => {
  try {
    const data = await reportService.getBranchWise(req.query);
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.getCompanyWise = async (req, res, next) => {
  try {
    const data = await reportService.getCompanyWise(req.query);
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.getPackageDistribution = async (req, res, next) => {
  try {
    const data = await reportService.getPackageDistribution(req.query);
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.getYearWise = async (req, res, next) => {
  try {
    const data = await reportService.getYearWise();
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.exportReport = async (req, res, next) => {
  try {
    const data = await reportService.exportData(req.query);
    sendSuccess(res, data, 'Report exported successfully');
  } catch (error) { next(error); }
};

exports.getNIRFGO = async (req, res, next) => {
  try {
    const data = await reportService.getNIRFGO(req.query);
    sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.exportNIRFGO = async (req, res, next) => {
  try {
    const data = await reportService.exportNIRFGO(req.query);
    sendSuccess(res, data, 'NIRF GO report exported successfully');
  } catch (error) { next(error); }
};
