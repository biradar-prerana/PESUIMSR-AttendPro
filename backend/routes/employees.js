const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(protect);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const { department, isActive, search } = req.query;
    let filter = {};
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .populate('shift', 'name startTime endTime')
      .populate('accessDoors', 'name location')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET next available employee ID for a department (must be before /:id)
router.get('/next-id/:departmentId', async (req, res) => {
  try {
    const dept = await Department.findById(req.params.departmentId);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    const code = dept.code.toUpperCase();
    const employees = await Employee.find({ department: req.params.departmentId }, 'employeeId');

    let maxSeq = 0;
    employees.forEach(emp => {
      if (emp.employeeId && emp.employeeId.toUpperCase().startsWith(code)) {
        const numPart = parseInt(emp.employeeId.slice(code.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) maxSeq = numPart;
      }
    });

    const nextNum = (maxSeq + 1).toString().padStart(3, '0');
    res.json({ employeeId: `${code}${nextNum}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id)
      .populate('department', 'name code')
      .populate('shift', 'name startTime endTime')
      .populate('accessDoors', 'name location doorId');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create employee
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    if (data.accessDoors && typeof data.accessDoors === 'string') {
      data.accessDoors = JSON.parse(data.accessDoors);
    }
    const emp = await Employee.create(data);
    res.status(201).json(emp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update employee
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    if (data.accessDoors && typeof data.accessDoors === 'string') {
      data.accessDoors = JSON.parse(data.accessDoors);
    }
    const emp = await Employee.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('department', 'name code')
      .populate('shift', 'name startTime endTime');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT enroll biometric
router.put('/:id/biometric', async (req, res) => {
  try {
    const { fingerprint, faceData } = req.body;
    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      { biometric: { fingerprint, faceData, enrolledAt: new Date() } },
      { new: true }
    );
    const io = req.app.get('io');
    io.emit('biometric_enrolled', { employeeId: emp.employeeId, name: `${emp.firstName} ${emp.lastName}` });
    res.json({ message: 'Biometric enrolled successfully', emp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE employee (permanent)
router.delete('/:id', async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
