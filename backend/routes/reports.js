const express = require('express');
const router = express.Router();
const AttendanceLog = require('../models/AttendanceLog');
const AccessLog = require('../models/AccessLog');
const Employee = require('../models/Employee');
const moment = require('moment');
const { protect } = require('../middleware/auth');

router.use(protect);

// Attendance report
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate, department, employeeId } = req.query;
    const start = startDate ? new Date(startDate) : moment().startOf('month').toDate();
    const end = endDate ? new Date(endDate) : moment().endOf('month').toDate();
    let filter = { date: { $gte: start, $lte: end } };
    if (employeeId) {
      const emp = await Employee.findOne({ employeeId });
      if (emp) filter.employee = emp._id;
    }
    let logs = await AttendanceLog.find(filter)
      .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
      .populate('shift', 'name')
      .sort({ date: -1 });
    if (department) logs = logs.filter(l => l.employee?.department?._id?.toString() === department);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Access log report
router.get('/access', async (req, res) => {
  try {
    const { startDate, endDate, door, status } = req.query;
    const start = startDate ? new Date(startDate) : moment().startOf('day').toDate();
    const end = endDate ? new Date(endDate) : moment().endOf('day').toDate();
    let filter = { timestamp: { $gte: start, $lte: end } };
    if (door) filter.door = door;
    if (status) filter.status = status;
    const logs = await AccessLog.find(filter)
      .populate('employee', 'firstName lastName employeeId photo')
      .populate('door', 'name location')
      .populate('device', 'name')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Summary stats
router.get('/summary', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const [totalEmployees, presentToday, lateToday, absentToday, accessGranted, accessDenied] = await Promise.all([
      Employee.countDocuments({ isActive: true }),
      AttendanceLog.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: { $in: ['Present', 'Late'] } }),
      AttendanceLog.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Late' }),
      AttendanceLog.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Absent' }),
      AccessLog.countDocuments({ timestamp: { $gte: today, $lte: todayEnd }, status: 'Granted' }),
      AccessLog.countDocuments({ timestamp: { $gte: today, $lte: todayEnd }, status: 'Denied' })
    ]);
    res.json({ totalEmployees, presentToday, lateToday, absentToday, accessGranted, accessDenied });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
