const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().populate('door', 'name location');
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('door', 'name location');
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Simulate heartbeat / status ping
router.post('/:id/ping', async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status: 'online', lastHeartbeat: new Date() },
      { new: true }
    );
    const io = req.app.get('io');
    io.emit('device_status', { deviceId: device.deviceId, status: 'online' });
    res.json({ message: 'Device online', device });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Device.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Device deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
