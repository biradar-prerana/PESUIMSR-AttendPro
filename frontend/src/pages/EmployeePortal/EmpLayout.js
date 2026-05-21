import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmpSidebar from './EmpSidebar';
import EmpDashboard from './EmpDashboard';
import EmpProfile from './EmpProfile';
import EmpAttendance from './EmpAttendance';
import EmpMarkAttendance from './EmpMarkAttendance';
import EmpApplyLeave from './EmpApplyLeave';
import EmpMyLeaves from './EmpMyLeaves';
import EmpLeaveBalance from './EmpLeaveBalance';

export default function EmpLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {mobileOpen && <div className="sidebar-backdrop show" onClick={() => setMobileOpen(false)} />}
      <EmpSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="emp-main" style={{ marginLeft: 240, background: 'var(--bg)', minHeight: '100vh' }}>
        {/* Mobile topbar */}
        <div className="show-mobile" style={{
          position: 'sticky', top: 0, zIndex: 99, background: 'white',
          borderBottom: '1px solid var(--gray-200)', padding: '12px 16px',
          alignItems: 'center', gap: 12
        }}>
          <button className="hamburger-btn" style={{ display: 'flex' }} onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>AttendPro</span>
        </div>
        <main style={{ padding: 24 }}>
          <Routes>
            <Route path="/dashboard"    element={<EmpDashboard />} />
            <Route path="/profile"      element={<EmpProfile />} />
            <Route path="/attendance"   element={<EmpAttendance />} />
            <Route path="/mark"         element={<EmpMarkAttendance />} />
            <Route path="/apply-leave"  element={<EmpApplyLeave />} />
            <Route path="/my-leaves"    element={<EmpMyLeaves />} />
            <Route path="/leave-balance" element={<EmpLeaveBalance />} />
            <Route path="*"             element={<Navigate to="/emp/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
