const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['APTA', 'COSEC_DOOR', 'BIOMETRIC', 'CARD_READER', 'FACE_READER'], default: 'APTA' },
  ipAddress: { type: String, required: true },
  port: { type: Number, default: 4370 },
  location: { type: String, required: true },
  door: { type: mongoose.Schema.Types.ObjectId, ref: 'Door' },
  status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
  lastHeartbeat: { type: Date },
  capabilities: {
    fingerprint: { type: Boolean, default: true },
    face: { type: Boolean, default: true },
    card: { type: Boolean, default: true },
    pin: { type: Boolean, default: true }
  },
  firmware: { type: String, default: '1.0.0' },
  serialNumber: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
