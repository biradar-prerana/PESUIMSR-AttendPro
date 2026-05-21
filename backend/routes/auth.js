const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await user.matchPassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, employee: user.employee } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/auth/register (admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!await user.matchPassword(currentPassword)) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/auth/create-employee-login  (admin creates login for an employee)
router.post('/create-employee-login', protect, async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const Employee = require('../models/Employee');
    const emp = await Employee.findOne({ employeeId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    const exists = await User.findOne({ email: emp.email });
    if (exists) return res.status(400).json({ message: 'Login already exists for this employee' });
    const user = await User.create({
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      password,
      role: 'employee',
      employee: emp._id
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.status(201).json({ message: 'Employee login created', email: emp.email, token });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
