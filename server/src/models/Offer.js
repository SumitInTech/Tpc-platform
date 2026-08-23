const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive' },
  role: { type: String, required: true },
  package: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  offerDate: { type: Date },
  joiningDate: { type: Date },
  status: { type: String, enum: ['OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'], default: 'OFFERED' },
  policyDecisionSnapshot: { type: mongoose.Schema.Types.Mixed },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
