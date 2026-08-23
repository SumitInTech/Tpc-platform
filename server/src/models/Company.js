const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  website: { type: String },
  industry: { type: String },
  logoUrl: { type: String },
  contactPerson: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  location: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
