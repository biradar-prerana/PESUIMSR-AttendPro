const express = require('express');
const router  = express.Router();
const Leave   = require('../models/Leave');
const AttendanceLog = require('../models/AttendanceLog');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');
const moment  = require('moment');

router.use(protect);

// ── Employee: apply for leave ─────────────────────────────────────────────────
router.post('/apply', async (req, res) => {
  try {
    const { employeeId, type, fromDate, toDate, reason } = req.body;

    // resolve employee
    let emp;
    if (employeeId) {
      emp = await Employee.findOne({ employeeId });
    } else if (req.user.employee) {
      emp = await Employee.findById(req.user.employee);
    }
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const from = moment(fromDate).startOf('day');
    const to   = moment(toDate).startOf('day');
    if (to.isBefore(from)) return res.status(400).json({ message: 'End date must be after start date' });

    // count working days (exclude Sundays)
    let days = 0;
    let cur  = from.clone();
    while (cur.isSameOrBefore(to)) { if (cur.day() !== 0) days++; cur.add(1, 'day'); }

    const leave = await Leave.create({ employee: emp._id, type, fromDate: from.toDate(), toDate: to.toDate(), days, reason });
    res.status(201).json(leave);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Get leaves (admin = all, employee = own) ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'employee') {
      const emp = await Employee.findById(req.user.employee);
      if (!emp) return res.status(404).json({ message: 'Employee not found' });
      filter.employee = emp._id;
    } else if (employeeId) {
      const emp = await Employee.findOne({ employeeId });
      if (emp) filter.employee = emp._id;
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department photo')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin: approve or reject ──────────────────────────────────────────────────
router.put('/:id/review', async (req, res) => {
  try {
    if (req.user.role === 'employee') return res.status(403).json({ message: 'Not authorized' });
    const { status, reviewNote } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status, reviewNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('employee', 'firstName lastName employeeId');

    // If approved, mark attendance as On Leave for those dates
    if (status === 'Approved') {
      let cur = moment(leave.fromDate).startOf('day');
      const end = moment(leave.toDate).startOf('day');
      while (cur.isSameOrBefore(end)) {
        if (cur.day() !== 0) {
          await AttendanceLog.findOneAndUpdate(
            { employee: leave.employee._id, date: cur.toDate() },
            { employee: leave.employee._id, date: cur.toDate(), status: 'On Leave', remarks: leave.type },
            { upsert: true }
          );
        }
        cur.add(1, 'day');
      }
      const io = req.app.get('io');
      io.emit('leave_reviewed', { employee: `${leave.employee.firstName} ${leave.employee.lastName}`, status });
    }
    res.json(leave);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Leave balance summary ─────────────────────────────────────────────────────
router.get('/balance/:employeeId', async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    const year = new Date().getFullYear();
    const start = new Date(`${year}-01-01`);
    const end   = new Date(`${year}-12-31`);
    const leaves = await Leave.find({ employee: emp._id, status: 'Approved', fromDate: { $gte: start, $lte: end } });
    const taken = { 'Casual Leave': 0, 'Earned Leave': 0, 'Maternity Leave': 0, 'Emergency Leave': 0 };
    leaves.forEach(l => { if (taken[l.type] !== undefined) taken[l.type] += l.days; });
    const entitlement = { 'Casual Leave': 12, 'Earned Leave': 15, 'Maternity Leave': 90, 'Emergency Leave': 5 };
    const balance = {};
    Object.keys(entitlement).forEach(k => { balance[k] = { entitled: entitlement[k], taken: taken[k] || 0, remaining: entitlement[k] - (taken[k] || 0) }; });
    res.json(balance);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
