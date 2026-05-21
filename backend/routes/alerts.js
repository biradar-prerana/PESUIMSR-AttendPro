const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { isRead, isResolved, severity } = req.query;
    let filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    if (severity) filter.severity = severity;
    const alerts = await Alert.find(filter)
      .populate('employee', 'firstName lastName employeeId photo')
      .populate('door', 'name location')
      .populate('device', 'name deviceId')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      isResolved: true, resolvedBy: req.user._id, resolvedAt: new Date()
    }, { new: true });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/mark-all-read', async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
