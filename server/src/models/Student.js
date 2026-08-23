const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  department: { type: String },
  branch: { type: String, index: true },
  batch: { type: String },
  graduationYear: { type: Number, index: true },
  cgpa: { type: Number, required: true },
  backlogs: { type: Number, default: 0 },
  activeBacklogs: { type: Number, default: 0 },
  skills: [{ type: String }],
  resumeUrl: { type: String },
  placementStatus: { type: String, enum: ['UNPLACED', 'PLACED', 'NOT_INTERESTED'], default: 'UNPLACED' },
  careerOutcome: {
    type: String,
    enum: ['PLACED', 'HIGHER_STUDIES', 'ENTREPRENEUR', 'PHD', 'SEEKING', 'NOT_INTERESTED'],
    default: null
  },
  acceptedOffersCount: { type: Number, default: 0 },
  highestAcceptedPackage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
