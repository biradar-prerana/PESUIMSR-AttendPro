const mongoose = require('mongoose');

const doorSchema = new mongoose.Schema({
  doorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  building: { type: String },
  floor: { type: String },
  type: { type: String, enum: ['Entry', 'Exit', 'Both'], default: 'Both' },
  accessMode: { type: String, enum: ['Card', 'PIN', 'Fingerprint', 'Face', 'Card+PIN', 'Card+Fingerprint', 'Face+Card'], default: 'Card' },
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  isActive: { type: Boolean, default: true },
  schedule: {
    alwaysOpen: { type: Boolean, default: false },
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '20:00' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Door', doorSchema);
