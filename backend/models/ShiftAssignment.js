const mongoose = require('mongoose');

const shiftAssignmentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignmentType: { type: String, enum: ['manual', 'automatic'], default: 'manual' },
  effectiveFrom: { type: Date, required: true },
  // null means open-ended — runs until admin changes it
  effectiveTo: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });

shiftAssignmentSchema.index({ employee: 1, isActive: 1 });
shiftAssignmentSchema.index({ employee: 1, effectiveFrom: -1 });

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema);
