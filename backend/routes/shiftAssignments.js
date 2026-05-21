const express = require('express');
const router = express.Router();
const ShiftAssignment = require('../models/ShiftAssignment');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');
const moment = require('moment');

router.use(protect);

// Helper: close any active assignment for an employee before creating a new one
async function closeActiveAssignment(employeeId, effectiveTo) {
  await ShiftAssignment.updateMany(
    { employee: employeeId, isActive: true },
    { isActive: false, effectiveTo: effectiveTo || new Date() }
  );
}

// GET /api/shift-assignments — list all active assignments
router.get('/', async (req, res) => {
  try {
    const { employee, department } = req.query;
    let filter = { isActive: true };
    if (employee) filter.employee = employee;

    let assignments = await ShiftAssignment.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('shift', 'name code startTime endTime gracePeriod workingDays')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    if (department) {
      assignments = assignments.filter(a => a.employee?.department?._id?.toString() === department);
    }

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/shift-assignments/employee/:employeeId/current — get effective shift for today
router.get('/employee/:employeeId/current', async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const today = moment().startOf('day').toDate();
    const assignment = await ShiftAssignment.findOne({
      employee: emp._id,
      isActive: true,
      effectiveFrom: { $lte: today }
    })
      .populate('shift')
      .sort({ effectiveFrom: -1 });

    res.json(assignment || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/shift-assignments/manual — assign shift to specific employees
router.post('/manual', async (req, res) => {
  try {
    const { employeeIds, shiftId, effectiveFrom, notes } = req.body;
    if (!employeeIds?.length || !shiftId || !effectiveFrom) {
      return res.status(400).json({ message: 'employeeIds, shiftId and effectiveFrom are required' });
    }

    const from = moment(effectiveFrom).startOf('day').toDate();
    const created = [];

    for (const empId of employeeIds) {
      // Close any existing active assignment (set effectiveTo to day before new effectiveFrom)
      const closingDate = moment(from).subtract(1, 'day').endOf('day').toDate();
      await closeActiveAssignment(empId, closingDate);

      const assignment = await ShiftAssignment.create({
        employee: empId,
        shift: shiftId,
        assignedBy: req.user._id,
        assignmentType: 'manual',
        effectiveFrom: from,
        effectiveTo: null,
        notes
      });

      // Keep employee.shift in sync for backward compatibility
      await Employee.findByIdAndUpdate(empId, { shift: shiftId });

      created.push(assignment);
    }

    const populated = await ShiftAssignment.find({ _id: { $in: created.map(a => a._id) } })
      .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
      .populate('shift', 'name code startTime endTime');

    res.status(201).json({ message: `Shift assigned to ${created.length} employee(s)`, assignments: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/shift-assignments/auto — assign shift to all employees in a dept (or all)
router.post('/auto', async (req, res) => {
  try {
    const { departmentId, shiftId, effectiveFrom, notes } = req.body;
    if (!shiftId || !effectiveFrom) {
      return res.status(400).json({ message: 'shiftId and effectiveFrom are required' });
    }

    const empFilter = { isActive: true };
    if (departmentId) empFilter.department = departmentId;

    const employees = await Employee.find(empFilter, '_id');
    if (!employees.length) return res.status(404).json({ message: 'No matching employees found' });

    const from = moment(effectiveFrom).startOf('day').toDate();
    const closingDate = moment(from).subtract(1, 'day').endOf('day').toDate();
    const created = [];

    for (const emp of employees) {
      await closeActiveAssignment(emp._id, closingDate);

      const assignment = await ShiftAssignment.create({
        employee: emp._id,
        shift: shiftId,
        assignedBy: req.user._id,
        assignmentType: 'automatic',
        effectiveFrom: from,
        effectiveTo: null,
        notes
      });

      await Employee.findByIdAndUpdate(emp._id, { shift: shiftId });
      created.push(assignment);
    }

    res.status(201).json({ message: `Shift auto-assigned to ${created.length} employee(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/shift-assignments/:id — remove/deactivate an assignment
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await ShiftAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.isActive = false;
    assignment.effectiveTo = new Date();
    await assignment.save();

    // Clear employee.shift reference
    await Employee.findByIdAndUpdate(assignment.employee, { shift: null });

    res.json({ message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
