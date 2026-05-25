import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import EmailPreviewBanner from './components/EmailPreviewBanner';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees/Employees';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import Departments from './pages/Departments';
import Shifts from './pages/Shifts';
import Devices from './pages/Devices/Devices';
import Attendance from './pages/Attendance/Attendance';
import AttendanceSimulator from './pages/Attendance/AttendanceSimulator';
import Reports from './pages/Reports/Reports';
import Alerts from './pages/Alerts/Alerts';
import Settings from './pages/Settings/Settings';
import LeaveManagement from './pages/LeaveManagement';
import Holidays from './pages/Holidays';
// Employee Portal
import EmpLayout from './pages/EmployeePortal/EmpLayout';

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;
  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {mobileOpen && <div className="sidebar-backdrop show" onClick={() => setMobileOpen(false)} />}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="admin-main" style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}>
        <Navbar sidebarWidth={sidebarWidth} onMenuClick={() => setMobileOpen(true)} />
        <main style={{ padding: '80px 20px 24px', minHeight: '100vh', background: 'var(--bg)' }}>
          <Routes>
            <Route path="/dashboard"           element={<Dashboard />} />
            <Route path="/employees"           element={<Employees />} />
            <Route path="/employees/:id"       element={<EmployeeDetail />} />
            <Route path="/departments"         element={<Departments />} />
            <Route path="/shifts"              element={<Shifts />} />
            <Route path="/devices"             element={<Devices />} />
            <Route path="/attendance"          element={<Attendance />} />
            <Route path="/attendance-simulator" element={<AttendanceSimulator />} />
            <Route path="/leave-management"    element={<LeaveManagement />} />
            <Route path="/holidays"            element={<Holidays />} />
            <Route path="/reports"             element={<Reports />} />
            <Route path="/alerts"              element={<Alerts />} />
            <Route path="/settings"            element={<Settings />} />
            <Route path="*"                    element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>PESUIMSR AttendPro</div>
        <div style={{ color: 'rgba(255,255,255,.6)' }}>Loading...</div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'employee' ? '/emp/dashboard' : '/dashboard'} replace />} />

      {/* Employee Portal */}
      <Route path="/emp/*" element={
        user && user.role === 'employee' ? <EmpLayout /> : <Navigate to="/login" replace />
      } />

      {/* Admin / Manager / Operator Portal */}
      <Route path="/*" element={
        user && user.role !== 'employee' ? <AdminLayout /> :
        user && user.role === 'employee' ? <Navigate to="/emp/dashboard" replace /> :
        <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <EmailPreviewBanner />
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: 10, fontSize: 14 } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
