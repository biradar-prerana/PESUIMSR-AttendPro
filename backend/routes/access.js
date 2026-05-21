const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');
const AccessPolicy = require('../models/AccessPolicy');
const Alert = require('../models/Alert');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');

router.use(protect);

// --- Access Policies ---
router.get('/policies', async (req, res) => {
  try {
    const policies = await AccessPolicy.find()
      .populate('doors', 'name location')
      .populate('departments', 'name code')
      .populate('employees', 'firstName lastName employeeId');
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/policies', async (req, res) => {
  try {
    const policy = await AccessPolicy.create(req.body);
    res.status(201).json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/policies/:id', async (req, res) => {
  try {
    const policy = await AccessPolicy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/policies/:id', async (req, res) => {
  try {
    await AccessPolicy.findByIdAndDelete(req.params.id);
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Access Logs ---
router.get('/logs', async (req, res) => {
  try {
    const { startDate, endDate, door, employee, status } = req.query;
    let filter = {};
    if (startDate && endDate) filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (door) filter.door = door;
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    const logs = await AccessLog.find(filter)
      .populate('employee', 'firstName lastName employeeId photo')
      .populate('door', 'name location')
      .populate('device', 'name deviceId')
      .sort({ timestamp: -1 })
      .limit(500);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simulate access attempt
router.post('/simulate', async (req, res) => {
  try {
    const { employeeId, doorId, method, direction } = req.body;
    const employee = await Employee.findOne({ employeeId }).populate('accessDoors');
    if (!employee) {
      const log = await AccessLog.create({ door: doorId, direction, method, status: 'Denied', reason: 'Unknown employee' });
      const alert = await Alert.create({ type: 'Unauthorized Access', severity: 'High', message: `Unknown credential at door`, door: doorId });
      const io = req.app.get('io');
      io.emit('access_event', { ...log.toObject(), alert });
      return res.json({ status: 'Denied', reason: 'Unknown employee' });
    }
    const hasAccess = employee.accessDoors.some(d => d._id.toString() === doorId);
    const status = hasAccess ? 'Granted' : 'Denied';
    const log = await AccessLog.create({ employee: employee._id, door: doorId, direction, method, status });
    if (!hasAccess) {
      await Alert.create({ type: 'Unauthorized Access', severity: 'High', message: `${employee.firstName} ${employee.lastName} denied at door`, employee: employee._id, door: doorId });
    }
    const io = req.app.get('io');
    io.emit('access_event', { ...log.toObject(), employeeName: `${employee.firstName} ${employee.lastName}`, status });
    res.json({ status, employee: `${employee.firstName} ${employee.lastName}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
