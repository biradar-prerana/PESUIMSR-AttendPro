const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type:        { type: String, enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Emergency Leave', 'Work From Home'], required: true },
  fromDate:    { type: Date, required: true },
  toDate:      { type: Date, required: true },
  days:        { type: Number, required: true },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  appliedAt:   { type: Date, default: Date.now },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date },
  reviewNote:  { type: String },
  attachment:  { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
