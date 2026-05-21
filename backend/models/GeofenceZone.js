const mongoose = require('mongoose');

const geofenceZoneSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  lat:      { type: Number, required: true },
  lng:      { type: Number, required: true },
  radius:   { type: Number, required: true, default: 100 }, // metres
  isActive: { type: Boolean, default: true },
  address:  { type: String },
}, { timestamps: true });

module.exports = mongoose.model('GeofenceZone', geofenceZoneSchema);
