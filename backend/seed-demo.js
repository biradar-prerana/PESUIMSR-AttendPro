require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Department = require('./models/Department');
const Shift = require('./models/Shift');
const Employee = require('./models/Employee');
const Door = require('./models/Door');
const Device = require('./models/Device');
const Holiday = require('./models/Holiday');
const AccessPolicy = require('./models/AccessPolicy');
const GeofenceZone = require('./models/GeofenceZone');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Department.deleteMany({});
  await Shift.deleteMany({});
  await Employee.deleteMany({});
  await Door.deleteMany({});
  await Device.deleteMany({});
  await Holiday.deleteMany({});
  await AccessPolicy.deleteMany({});
  await GeofenceZone.deleteMany({});

  const user = await User.create({
    name: 'System Admin',
    email: 'admin@cosec.com',
    password: 'admin123',
    role: 'admin'
  });
  console.log('✅ Admin user created');

  const departments = await Department.insertMany([
    { name: 'Administration', code: 'ADM' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Doctors', code: 'DOC' },
    { name: 'Nurses', code: 'NUR' },
    { name: 'Emergency', code: 'ER' },
    { name: 'Intensive Care Unit', code: 'ICU' },
    { name: 'Outpatient Department', code: 'OPD' },
    { name: 'Pharmacy', code: 'PHA' },
    { name: 'Laboratory', code: 'LAB' },
    { name: 'Radiology', code: 'RAD' },
    { name: 'Cardiology', code: 'CAR' },
    { name: 'Neurology', code: 'NEU' },
    { name: 'Orthopedics', code: 'ORT' },
    { name: 'Pediatrics', code: 'PED' },
    { name: 'Gynecology', code: 'GYN' },
    { name: 'Oncology', code: 'ONC' },
    { name: 'Dermatology', code: 'DER' },
    { name: 'ENT', code: 'ENT' },
    { name: 'Dental', code: 'DEN' },
    { name: 'Anesthesiology', code: 'ANE' },
    { name: 'Surgery', code: 'SUR' },
    { name: 'Physiotherapy', code: 'PHY' },
    { name: 'Psychiatry', code: 'PSY' },
    { name: 'Dialysis', code: 'DIA' },
    { name: 'Blood Bank', code: 'BLD' },
    { name: 'Operation Theatre', code: 'OT' },
    { name: 'Reception', code: 'REC' },
    { name: 'Billing', code: 'BIL' },
    { name: 'Insurance', code: 'INS' },
    { name: 'Medical Records', code: 'MRD' },
    { name: 'Housekeeping', code: 'HKS' },
    { name: 'Security', code: 'SEC' },
    { name: 'Maintenance', code: 'MNT' },
    { name: 'IT Support', code: 'ITS' },
    { name: 'Procurement', code: 'PRC' },
    { name: 'Cafeteria', code: 'CAF' },
    { name: 'Ambulance Services', code: 'AMB' },
    { name: 'Quality Assurance', code: 'QAS' },
    { name: 'Infection Control', code: 'INF' },
    { name: 'Mortuary', code: 'MOR' }
  ]);
  console.log('✅ Departments created');

  const shifts = await Shift.insertMany([
    {
      code: 'MORNING',
      name: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
      gracePeriod: 15,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
      code: 'EVENING',
      name: 'Evening Shift',
      startTime: '14:00',
      endTime: '22:00',
      gracePeriod: 15,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
      code: 'NIGHT',
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      gracePeriod: 10,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    {
      code: 'GENERAL',
      name: 'General Duty Shift',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriod: 15,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
      code: 'ICU_DAY',
      name: 'ICU Day Shift',
      startTime: '07:00',
      endTime: '19:00',
      gracePeriod: 10,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    {
      code: 'ICU_NIGHT',
      name: 'ICU Night Shift',
      startTime: '19:00',
      endTime: '07:00',
      gracePeriod: 10,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    {
      code: 'EMERGENCY',
      name: 'Emergency Shift',
      startTime: '08:00',
      endTime: '20:00',
      gracePeriod: 5,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    {
      code: 'ON_CALL',
      name: 'On Call Shift',
      startTime: '00:00',
      endTime: '23:59',
      gracePeriod: 0,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    {
      code: 'WEEKEND',
      name: 'Weekend Duty Shift',
      startTime: '08:00',
      endTime: '18:00',
      gracePeriod: 15,
      workingDays: ['Saturday', 'Sunday']
    },
    {
      code: 'HALF_DAY',
      name: 'Half Day Shift',
      startTime: '09:00',
      endTime: '13:00',
      gracePeriod: 10,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  ]);
  console.log('✅ Shifts created');

  const doors = await Door.insertMany([
    { doorId: 'DOOR001', name: 'Main Entrance', location: 'Ground Floor', accessMode: 'Card+Fingerprint', isActive: true },
    { doorId: 'DOOR002', name: 'Human Resources Room Reader', location: '2nd Floor', accessMode: 'Card', isActive: true },
    { doorId: 'DOOR003', name: 'Nurses Department Reader', location: '1st Floor', accessMode: 'Face', isActive: true },
    { doorId: 'DOOR004', name: 'Server Room', location: 'Basement', accessMode: 'Card+PIN', isActive: true },
    { doorId: 'DOOR005', name: 'Emergency Exit', location: 'All Floors', accessMode: 'Card', isActive: true }
  ]);
  console.log('✅ Doors created');

  const devices = await Device.insertMany([
    {
      deviceId: 'DEV001',
      name: 'Main Entrance Reader',
      type: 'BIOMETRIC',
      ipAddress: '192.168.1.101',
      port: 4370,
      location: 'Ground Floor',
      door: doors[0]._id,
      status: 'online',
      capabilities: { fingerprint: true, face: true, card: true, pin: true },
      firmware: '1.0.0',
      serialNumber: 'SN123456789',
      isActive: true
    },
    {
      deviceId: 'DEV002',
      name: 'Human Resources Room Reader',
      type: 'CARD_READER',
      ipAddress: '192.168.1.102',
      port: 4370,
      location: '2nd Floor',
      door: doors[1]._id,
      status: 'online',
      capabilities: { fingerprint: false, face: false, card: true, pin: true },
      firmware: '1.0.0',
      serialNumber: 'SN987654321',
      isActive: true
    },
    {
      deviceId: 'DEV003',
      name: 'Nurses Department Reader',
      type: 'FACE_READER',
      ipAddress: '192.168.1.103',
      port: 4370,
      location: '1st Floor',
      door: doors[2]._id,
      status: 'offline',
      capabilities: { fingerprint: false, face: true, card: false, pin: true },
      firmware: '1.0.0',
      serialNumber: 'SN456123789',
      isActive: true
    },
    {
      deviceId: 'DEV004',
      name: 'Surgery Room Reader',
      type: 'APTA',
      ipAddress: '192.168.1.104',
      port: 4370,
      location: 'Basement',
      door: doors[3]._id,
      status: 'online',
      capabilities: { fingerprint: true, face: true, card: true, pin: true },
      firmware: '1.0.0',
      serialNumber: 'SN789456123',
      isActive: true
    }
  ]);
  console.log('✅ Devices created');

  const employees = await Employee.insertMany([
    {
      employeeId: 'EMP001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@hospital.com',
      designation: 'HR Manager',
      department: departments[0]._id,
      shift: shifts[3]._id,
      cardNumber: 'CARD001',
      phone: '+91 9876543210',
      joinDate: new Date('2023-01-15'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-001',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP002',
      firstName: 'Priya',
      lastName: 'Reddy',
      email: 'priya.reddy@hospital.com',
      designation: 'Staff Nurse',
      department: departments[3]._id,
      shift: shifts[0]._id,
      cardNumber: 'CARD002',
      phone: '+91 9876543211',
      joinDate: new Date('2023-02-10'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-002',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP003',
      firstName: 'Rahul',
      lastName: 'Verma',
      email: 'rahul.verma@hospital.com',
      designation: 'Cardiologist',
      department: departments[10]._id,
      shift: shifts[3]._id,
      cardNumber: 'CARD003',
      phone: '+91 9876543212',
      joinDate: new Date('2022-11-20'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-003',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP004',
      firstName: 'Sneha',
      lastName: 'Iyer',
      email: 'sneha.iyer@hospital.com',
      designation: 'Lab Technician',
      department: departments[8]._id,
      shift: shifts[1]._id,
      cardNumber: 'CARD004',
      phone: '+91 9876543213',
      joinDate: new Date('2023-03-05'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-004',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP005',
      firstName: 'Vikram',
      lastName: 'Patel',
      email: 'vikram.patel@hospital.com',
      designation: 'Emergency Doctor',
      department: departments[4]._id,
      shift: shifts[6]._id,
      cardNumber: 'CARD005',
      phone: '+91 9876543214',
      joinDate: new Date('2021-08-18'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-005',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP006',
      firstName: 'Ananya',
      lastName: 'Kulkarni',
      email: 'ananya.kulkarni@hospital.com',
      designation: 'Pharmacist',
      department: departments[7]._id,
      shift: shifts[0]._id,
      cardNumber: 'CARD006',
      phone: '+91 9876543215',
      joinDate: new Date('2023-04-12'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-006',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP007',
      firstName: 'Karthik',
      lastName: 'Nair',
      email: 'karthik.nair@hospital.com',
      designation: 'IT Administrator',
      department: departments[33]._id,
      shift: shifts[3]._id,
      cardNumber: 'CARD007',
      phone: '+91 9876543216',
      joinDate: new Date('2022-09-25'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-007',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP008',
      firstName: 'Meera',
      lastName: 'Joshi',
      email: 'meera.joshi@hospital.com',
      designation: 'Receptionist',
      department: departments[27]._id,
      shift: shifts[1]._id,
      cardNumber: 'CARD008',
      phone: '+91 9876543217',
      joinDate: new Date('2023-05-30'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-008',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP009',
      firstName: 'Arjun',
      lastName: 'Menon',
      email: 'arjun.menon@hospital.com',
      designation: 'Security Officer',
      department: departments[31]._id,
      shift: shifts[2]._id,
      cardNumber: 'CARD009',
      phone: '+91 9876543218',
      joinDate: new Date('2022-06-14'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-009',
        faceData: null,
        enrolledAt: new Date()
      }
    },
    {
      employeeId: 'EMP010',
      firstName: 'Divya',
      lastName: 'Krishnan',
      email: 'divya.krishnan@hospital.com',
      designation: 'Physiotherapist',
      department: departments[21]._id,
      shift: shifts[0]._id,
      cardNumber: 'CARD010',
      phone: '+91 9876543219',
      joinDate: new Date('2023-01-28'),
      isActive: true,
      biometric: {
        fingerprint: 'demo-fp-cred-010',
        faceData: null,
        enrolledAt: new Date()
      }
    }
  ]);
  console.log('✅ Employees created');

  const holidays = await Holiday.insertMany([
    { name: 'New Year', date: new Date('2026-01-01'), year: 2026 },
    { name: 'Republic Day', date: new Date('2026-01-26'), year: 2026 },
    { name: 'Independence Day', date: new Date('2026-08-15'), year: 2026 },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02'), year: 2026 },
    { name: 'Christmas', date: new Date('2026-12-25'), year: 2026 }
  ]);
  console.log('✅ Holidays created');

  const accessPolicies = await AccessPolicy.insertMany([
    {
      name: 'All Employees - Main Entrance',
      departments: [],
      doors: [doors[0]._id],
      timeSlots: [
        { day: 'All', startTime: '00:00', endTime: '23:59' }
      ],
      isActive: true
    },
    {
      name: 'IT Department - IT Floor',
      departments: [departments[1]._id],
      doors: [doors[1]._id],
      timeSlots: [
        { day: 'Monday', startTime: '08:00', endTime: '20:00' },
        { day: 'Tuesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Wednesday', startTime: '08:00', endTime: '20:00' },
        { day: 'Thursday', startTime: '08:00', endTime: '20:00' },
        { day: 'Friday', startTime: '08:00', endTime: '20:00' }
      ],
      isActive: true
    },
    {
      name: 'HR Department - HR Floor',
      departments: [departments[0]._id],
      doors: [doors[2]._id],
      timeSlots: [
        { day: 'Monday', startTime: '09:00', endTime: '18:00' },
        { day: 'Tuesday', startTime: '09:00', endTime: '18:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
        { day: 'Thursday', startTime: '09:00', endTime: '18:00' },
        { day: 'Friday', startTime: '09:00', endTime: '18:00' }
      ],
      isActive: true
    }
  ]);
  console.log('✅ Access Policies created');

  const geofence = await GeofenceZone.create({
    name: 'PESUIMSR Campus',
    lat: 12.9345,
    lng: 77.5345,
    radius: 200,
    address: 'PES University, Ring Road, Banashankari, Bengaluru, Karnataka',
    isActive: true
  });
  console.log('✅ Geofence Zone created');

  console.log('\n🎉 Demo database seeded successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Admin: admin@cosec.com / admin123`);
  console.log(`- Departments: ${departments.length}`);
  console.log(`- Shifts: ${shifts.length}`);
  console.log(`- Employees: ${employees.length}`);
  console.log(`- Doors: ${doors.length}`);
  console.log(`- Devices: ${devices.length}`);
  console.log(`- Holidays: ${holidays.length}`);
  console.log(`- Access Policies: ${accessPolicies.length}`);
  console.log(`- Geofence Zone: 1`);

  await mongoose.disconnect();
};

seed().catch(console.error);
