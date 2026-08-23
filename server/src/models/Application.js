const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  status: { type: String, enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'], default: 'APPLIED' },
  eligibilitySnapshot: { type: mongoose.Schema.Types.Mixed },
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    remarks: { type: String }
  }],
  appliedAt: { type: Date, default: Date.now },
  shortlistedAt: { type: Date },
  interviewAt: { type: Date },
  selectedAt: { type: Date },
  rejectedAt: { type: Date },
  remarks: { type: String },
  resume: { type: String },
  resumeName: { type: String },
  whyThisRole: { type: String },
  highlightedSkills: [{ type: String }]
}, { timestamps: true });

applicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
