const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  jobRole: { type: String, required: true },
  jobType: { type: String, enum: ['FULL_TIME', 'INTERN', 'CONTRACT'], required: true },
  location: { type: String },
  package: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  driveDate: { type: Date },
  applicationStart: { type: Date },
  applicationDeadline: { type: Date, index: true },
  graduationYears: [{ type: Number }],
  eligibleBranches: [{ type: String }],
  eligibilityRules: {
    ruleGroup: { type: String, enum: ['ALL', 'ANY'], default: 'ALL' },
    rules: [{
      field: { type: String, required: true },
      operator: { type: String, enum: ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'IN', 'NOT_IN'], required: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true }
    }]
  },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED', 'CANCELLED'], default: 'DRAFT', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
  closedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Drive', driveSchema);
