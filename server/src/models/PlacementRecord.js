const mongoose = require('mongoose');

const placementRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive' },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  package: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  placementDate: { type: Date, required: true },
  joiningDate: { type: Date },
  status: { type: String, enum: ['PLACED', 'JOINING_PENDING', 'JOINED', 'WITHDRAWN'], default: 'PLACED' },
  academicYear: { type: String, required: true, index: true },
  graduationYear: { type: Number, required: true },
  department: { type: String },
  branch: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PlacementRecord', placementRecordSchema);
