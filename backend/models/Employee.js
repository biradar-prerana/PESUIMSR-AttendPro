const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  photo: { type: String },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  designation: { type: String },
  joinDate: { type: Date, required: true },
  cardNumber: { type: String, unique: true, sparse: true },
  pin: { type: String },
  biometric: {
    fingerprint: { type: String, default: null },  // base64 simulated
    faceData: { type: String, default: null },      // base64 image
    enrolledAt: { type: Date }
  },
  accessDoors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Door' }],
  isActive: { type: Boolean, default: true },
  address: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String }
}, { timestamps: true });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);
