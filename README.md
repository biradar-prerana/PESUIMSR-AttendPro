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

### Backend: Quick-start (checks & defaults)

We provide a convenience startup script that checks required env vars and creates reasonable defaults for local development, then starts the backend.

```bash
cd cosec-web/backend
npm install
# Create or update .env with defaults and start dev server
npm run start:checked
```

### 2. Frontend Setup
```bash
cd cosec-web/frontend
npm install
npm start             # Starts frontend on :3000
```

Tip: Run the frontend in development mode (`npm start`) and open http://localhost:3000.

### Real Email Setup

The backend already sends email when:
- a new employee is created
- an employee checks in
- an employee checks out
- HR notifications are needed, if `HR_EMAIL` is set

For free real email delivery, use Gmail SMTP with a Google App Password.

1. Open your Google account and enable 2-Step Verification.
2. Create an App Password for Mail.
3. Put these values in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_app_password
FROM_EMAIL=yourgmail@gmail.com
HR_EMAIL=hr@example.com
```

Restart the backend after changing `.env`.

You can test the SMTP setup from the backend folder:

```bash
npm run test:email -- employee@example.com
```

Important: `SMTP_PASS` must be the Google App Password, not your normal Gmail password. If SMTP is missing or incomplete, the employee/attendance action will still complete, but email delivery will be skipped and the backend console will show the SMTP configuration error.

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
