const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Device = require('../models/Device');
const Door = require('../models/Door');
const AttendanceLog = require('../models/AttendanceLog');
const AccessLog = require('../models/AccessLog');
const Alert = require('../models/Alert');
const moment = require('moment');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const [
      totalEmployees, activeDevices, totalDoors, presentToday,
      lateToday, alertsToday, accessDeniedToday, recentAccess
    ] = await Promise.all([
      Employee.countDocuments({ isActive: true }),
      Device.countDocuments({ status: 'online' }),
      Door.countDocuments({ isActive: true }),
      AttendanceLog.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: { $in: ['Present', 'Late'] } }),
      AttendanceLog.countDocuments({ date: { $gte: today, $lte: todayEnd }, status: 'Late' }),
      Alert.countDocuments({ createdAt: { $gte: today, $lte: todayEnd }, isResolved: false }),
      AccessLog.countDocuments({ timestamp: { $gte: today, $lte: todayEnd }, status: 'Denied' }),
      AccessLog.find({ timestamp: { $gte: today, $lte: todayEnd } })
        .populate('employee', 'firstName lastName employeeId photo')
        .populate('door', 'name location')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    // Weekly attendance chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, 'days');
      const count = await AttendanceLog.countDocuments({
        date: { $gte: day.startOf('day').toDate(), $lte: day.endOf('day').toDate() },
        status: { $in: ['Present', 'Late'] }
      });
      weeklyData.push({ day: day.format('ddd'), count });
    }

    res.json({ totalEmployees, activeDevices, totalDoors, presentToday, lateToday, alertsToday, accessDeniedToday, recentAccess, weeklyData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
