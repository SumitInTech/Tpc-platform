const mongoose = require('mongoose');

const placementPolicySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['MAX_ACCEPTED_OFFERS', 'MAX_TOTAL_OFFERS', 'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION', 'PLACED_STUDENT_RESTRICTION', 'BRANCH_SPECIFIC_RESTRICTION'], required: true },
  configuration: { type: mongoose.Schema.Types.Mixed },
  scope: { type: String, enum: ['INSTITUTION', 'BRANCH', 'DEPARTMENT'], default: 'INSTITUTION' },
  isActive: { type: Boolean, default: true },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  version: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PlacementPolicy', placementPolicySchema);
