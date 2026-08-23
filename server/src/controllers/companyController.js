const Company = require('../models/Company');
const AppError = require('../utils/AppError');
const { sendSuccess, sendPaginated } = require('../utils/responseHelper');

exports.getCompanies = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, industry } = req.query;
    const query = {};
    if (search) query.name = new RegExp(search, 'i');
    if (industry) query.industry = industry;

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Company.countDocuments(query);
    
    sendPaginated(res, companies, { total, page: Number(page), limit: Number(limit) });
  } catch (error) { next(error); }
};

exports.getCompanySummary = async (req, res, next) => {
  try {
    const { search, industry } = req.query;
    const match = {};
    if (search) match.name = new RegExp(search, 'i');
    if (industry) match.industry = industry;

    const [total, active, withWebsite, industries] = await Promise.all([
      Company.countDocuments(match),
      Company.countDocuments({ ...match, isActive: true }),
      Company.countDocuments({ ...match, website: { $nin: ['', null] } }),
      Company.distinct('industry', match).then((x) => x.filter(Boolean).length),
    ]);
    sendSuccess(res, { total, active, withWebsite, industries });
  } catch (error) { next(error); }
};

exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    sendSuccess(res, company);
  } catch (error) { next(error); }
};

exports.createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    sendSuccess(res, company, 'Company created', 201);
  } catch (error) { next(error); }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    sendSuccess(res, company, 'Company updated');
  } catch (error) { next(error); }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    sendSuccess(res, {}, 'Company deleted');
  } catch (error) { next(error); }
};
