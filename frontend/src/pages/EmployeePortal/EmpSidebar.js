import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, label, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span>{label}</span>
  </NavLink>
);

export default function EmpSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setMobileOpen && setMobileOpen(false);

  return (
    <div
      className={`emp-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      style={{ width: 240, minHeight: '100vh', background: 'var(--primary)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, transition: 'transform .3s, width .3s' }}
    >
      {/* Logo */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <img src="/pes-logo.png" alt="PESUIMSR" style={{ width: '100%', height: 56, objectFit: 'contain' }} />
        <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>AttendPro</div>
        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: 600 }}>Employee Portal</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, padding: '8px 8px 4px', textTransform: 'uppercase' }}>My Space</div>
        <NavItem to="/emp/dashboard"  label="My Dashboard"     onClick={close} />
        <NavItem to="/emp/profile"    label="My Profile"       onClick={close} />
        <NavItem to="/emp/attendance" label="My Attendance"    onClick={close} />
        <NavItem to="/emp/mark"       label="Mark Attendance"  onClick={close} />
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, padding: '12px 8px 4px', textTransform: 'uppercase' }}>Leave</div>
        <NavItem to="/emp/apply-leave"   label="Apply for Leave" onClick={close} />
        <NavItem to="/emp/my-leaves"     label="My Leaves"       onClick={close} />
        <NavItem to="/emp/leave-balance" label="Leave Balance"   onClick={close} />
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11 }}>Employee</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="nav-item" style={{ width: '100%' }}>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
