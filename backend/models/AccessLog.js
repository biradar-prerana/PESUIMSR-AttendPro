const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  door: { type: mongoose.Schema.Types.ObjectId, ref: 'Door', required: true },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  timestamp: { type: Date, default: Date.now },
  direction: { type: String, enum: ['In', 'Out'], required: true },
  method: { type: String, enum: ['Card', 'PIN', 'Fingerprint', 'Face', 'Manual'] },
  status: { type: String, enum: ['Granted', 'Denied'], required: true },
  reason: { type: String },
  cardNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AccessLog', accessLogSchema);
