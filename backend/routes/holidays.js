const express = require('express');
const router  = express.Router();
const Holiday = require('../models/Holiday');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET all holidays — optionally filter by year (all roles)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.year) filter.year = parseInt(req.query.year);
    const holidays = await Holiday.find(filter).sort({ date: 1 });
    res.json(holidays);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create holiday (admin / manager / operator only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'employee') return res.status(403).json({ message: 'Not authorized' });
    const { name, date, description } = req.body;
    if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });
    const year = new Date(date).getFullYear();
    const holiday = await Holiday.create({ name, date, description, year });
    res.status(201).json(holiday);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update holiday
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee') return res.status(403).json({ message: 'Not authorized' });
    const { name, date, description } = req.body;
    const updateData = { name, description };
    if (date) { updateData.date = date; updateData.year = new Date(date).getFullYear(); }
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' });
    res.json(holiday);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE holiday
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee') return res.status(403).json({ message: 'Not authorized' });
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' });
    res.json({ message: 'Holiday deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
