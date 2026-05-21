const express = require('express');
const router = express.Router();
const Door = require('../models/Door');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const doors = await Door.find().populate('device', 'name deviceId status');
    res.json(doors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const door = await Door.findById(req.params.id).populate('device', 'name deviceId status');
    if (!door) return res.status(404).json({ message: 'Door not found' });
    res.json(door);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const door = await Door.create(req.body);
    res.status(201).json(door);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const door = await Door.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!door) return res.status(404).json({ message: 'Door not found' });
    res.json(door);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Door.findByIdAndDelete(req.params.id);
    res.json({ message: 'Door deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
