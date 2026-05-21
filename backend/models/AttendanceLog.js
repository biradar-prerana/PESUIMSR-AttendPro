const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday'], default: 'Absent' },
  checkInDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  checkOutDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  checkInMethod: { type: String, enum: ['Card', 'PIN', 'Fingerprint', 'Face', 'Manual'] },
  checkOutMethod: { type: String, enum: ['Card', 'PIN', 'Fingerprint', 'Face', 'Manual'] },
  overtime: { type: Number, default: 0 },
  remarks: { type: String },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }
}, { timestamps: true });

attendanceLogSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
