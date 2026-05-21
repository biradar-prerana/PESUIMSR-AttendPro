const express = require('express');
const router = express.Router();
const AttendanceLog = require('../models/AttendanceLog');
const Employee = require('../models/Employee');
const ShiftAssignment = require('../models/ShiftAssignment');
const Alert = require('../models/Alert');
const GeofenceZone = require('../models/GeofenceZone');
const moment = require('moment');
const { protect } = require('../middleware/auth');

// Haversine distance in metres
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.use(protect);

// GET attendance logs
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, employee, department, status } = req.query;
    let filter = {};
    if (startDate && endDate) filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    let query = AttendanceLog.find(filter)
      .populate({ path: 'employee', select: 'firstName lastName employeeId photo department', populate: { path: 'department', select: 'name' } })
      .populate('shift', 'name startTime endTime')
      .sort({ date: -1 });
    let logs = await query;
    if (department) logs = logs.filter(l => l.employee?.department?._id?.toString() === department);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST mark attendance (check-in or check-out)
router.post('/mark', async (req, res) => {
  try {
    const { employeeId, type, method, deviceId, lat, lng } = req.body; // type: 'checkin' | 'checkout'
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // --- Resolve effective shift from ShiftAssignment (source of truth) ---
    const today = moment().startOf('day').toDate();
    const activeAssignment = await ShiftAssignment.findOne({
      employee: employee._id,
      isActive: true,
      effectiveFrom: { $lte: today }
    }).populate('shift').sort({ effectiveFrom: -1 });
    const shift = activeAssignment?.shift || null;
    // --- End shift resolution ---

    // --- Geofence validation ---
    const activeZones = await GeofenceZone.find({ isActive: true });
    if (activeZones.length > 0) {
      if (lat == null || lng == null) {
        return res.status(403).json({ message: 'Location access is required to mark attendance. Please allow location and try again.' });
      }
      const insideAny = activeZones.some(z => haversineDistance(lat, lng, z.lat, z.lng) <= z.radius);
      if (!insideAny) {
        return res.status(403).json({ message: 'You are outside the allowed attendance zone. Please move to the designated area and try again.' });
      }
    }
    // --- End geofence validation ---

    let log = await AttendanceLog.findOne({ employee: employee._id, date: today });

    if (type === 'checkin') {
      if (log) return res.status(400).json({ message: 'Already checked in today' });
      const shiftStart = shift ? shift.startTime : '09:00';
      const [sh, sm] = shiftStart.split(':').map(Number);
      const shiftTime = moment().startOf('day').add(sh, 'hours').add(sm, 'minutes');
      const gracePeriod = shift ? shift.gracePeriod : 15;
      const isLate = moment().isAfter(shiftTime.add(gracePeriod, 'minutes'));
      const status = isLate ? 'Late' : 'Present';
      log = await AttendanceLog.create({
        employee: employee._id, date: today, checkIn: new Date(), status,
        checkInMethod: method, checkInDevice: deviceId, shift: shift?._id
      });
      if (isLate) {
        await Alert.create({ type: 'Late CheckIn', severity: 'Low', message: `${employee.firstName} ${employee.lastName} checked in late`, employee: employee._id });
        const io = req.app.get('io');
        io.emit('attendance_event', { type: 'late', employee: `${employee.firstName} ${employee.lastName}` });
      }
    } else {
      if (!log) return res.status(400).json({ message: 'No check-in found for today' });
      const checkOut = new Date();
      const workingHours = moment(checkOut).diff(moment(log.checkIn), 'hours', true);
      log.checkOut = checkOut;
      log.checkOutMethod = method;
      log.checkOutDevice = deviceId;
      log.workingHours = parseFloat(workingHours.toFixed(2));
      if (log.status === 'Present' && workingHours < 4) log.status = 'Half Day';
      await log.save();
    }
    const io = req.app.get('io');
    io.emit('attendance_event', { type, employee: `${employee.firstName} ${employee.lastName}`, time: new Date() });
    res.json({ message: `${type} successful`, log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT manual update
router.put('/:id', async (req, res) => {
  try {
    const log = await AttendanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET summary for an employee
router.get('/summary/:employeeId', async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();
    const logs = await AttendanceLog.find({ employee: emp._id, date: { $gte: startOfMonth, $lte: endOfMonth } });
    const summary = {
      present: logs.filter(l => l.status === 'Present').length,
      absent: logs.filter(l => l.status === 'Absent').length,
      late: logs.filter(l => l.status === 'Late').length,
      halfDay: logs.filter(l => l.status === 'Half Day').length,
      onLeave: logs.filter(l => l.status === 'On Leave').length,
      totalWorkingHours: logs.reduce((sum, l) => sum + (l.workingHours || 0), 0).toFixed(2)
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
