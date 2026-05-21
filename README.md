# COSEC Web — Access Control & Time Attendance Management System

A full-stack MERN application inspired by Matrix COSEC APTA.

## Tech Stack
- **MongoDB** — Database
- **Express.js** — Backend API
- **React.js** — Frontend UI
- **Node.js** — Runtime
- **Socket.io** — Real-time events
- **Colors**: #1F3F7A (Blue) + #F58220 (Orange)

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running on localhost:27017

### 1. Backend Setup
```bash
cd cosec-web/backend
npm install
node seed.js          # Creates admin user
npm run dev           # Starts backend on :5000
```

### 2. Frontend Setup
```bash
cd cosec-web/frontend
npm install
npm start             # Starts frontend on :3000
```

### 3. Login
- **URL**: http://localhost:3000
- **Email**: admin@cosec.com
- **Password**: admin123

### 4. Seed Demo Data
After login → Settings → System → "Seed Demo Database"

---

## Features

| Module | Details |
|---|---|
| Dashboard | Real-time stats, weekly chart, live access events |
| Employees | Full CRUD, photo upload, biometric enrollment |
| Biometric | Face capture (webcam) + Fingerprint simulation |
| Departments | CRUD management |
| Shifts | Time-based shifts with grace period & working days |
| Devices | APTA device registration, status ping |
| Doors | Door configuration with access modes |
| Access Policies | Time-slot based access rules per dept/door |
| Access Logs | Real-time access event log with CSV export |
| Attendance | Check-in/out tracking with CSV export |
| Simulator | Interactive biometric terminal (Face/FP/Card/PIN) |
| Reports | Attendance & Access reports with charts |
| Alerts | Real-time unauthorized access alerts |
| Settings | Password change, user creation, data seeding |
