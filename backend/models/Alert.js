const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Unauthorized Access', 'Device Offline', 'Late CheckIn', 'Early CheckOut', 'Tailgating', 'Door Forced', 'Invalid Credential'],
    required: true
  },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  message: { type: String, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  door: { type: mongoose.Schema.Types.ObjectId, ref: 'Door' },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
