import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';

const pageTitles = {
  '/dashboard': 'Dashboard', '/employees': 'Employee Management', '/departments': 'Departments',
  '/shifts': 'Shift Management', '/devices': 'Device Management',
  '/access-policies': 'Access Policies', '/access-logs': 'Access Logs', '/attendance': 'Attendance',
  '/attendance-simulator': 'Attendance Simulator', '/leave-management': 'Leave Management',
  '/reports': 'Reports', '/alerts': 'Alerts', '/settings': 'Settings'
};

export default function Navbar({ sidebarWidth, onMenuClick }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const title = pageTitles[location.pathname] || 'PESUIMSR AttendPro';

  useEffect(() => {
    api.get('/alerts?isRead=false').then(r => setUnread(r.data.length)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/alerts?isRead=false').then(r => setUnread(r.data.length)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 60,
      background: 'white', borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', zIndex: 99, transition: 'left .3s'
    }}
    className="admin-navbar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger — only visible on mobile via CSS */}
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }} className="hide-mobile">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <a href="/alerts" style={{ color: 'var(--gray-500)', fontSize: 20, textDecoration: 'none' }}>🔔</a>
          {unread > 0 && (
            <div style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--gray-200)' }} className="hide-mobile" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>A</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }} className="hide-mobile">Admin</span>
        </div>
      </div>
    </div>
  );
}
