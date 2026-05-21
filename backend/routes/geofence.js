const express = require('express');
const router = express.Router();
const GeofenceZone = require('../models/GeofenceZone');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET all zones
router.get('/', async (req, res) => {
  try {
    const zones = await GeofenceZone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create zone
router.post('/', async (req, res) => {
  try {
    const zone = await GeofenceZone.create(req.body);
    res.status(201).json(zone);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update zone
router.put('/:id', async (req, res) => {
  try {
    const zone = await GeofenceZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json(zone);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE zone
router.delete('/:id', async (req, res) => {
  try {
    await GeofenceZone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Zone deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
