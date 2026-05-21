const mongoose = require('mongoose');

const accessPolicySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  doors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Door' }],
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  timeSlots: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','All'] },
    startTime: { type: String },
    endTime: { type: String }
  }],
  validFrom: { type: Date },
  validTo: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('AccessPolicy', accessPolicySchema);
