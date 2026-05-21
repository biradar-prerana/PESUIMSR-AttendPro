
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, label, collapsed, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : ''}>
    {!collapsed && <span>{label}</span>}
    {collapsed && <span style={{ fontSize: 12, fontWeight: 700 }}>{label.slice(0, 2)}</span>}
  </NavLink>
);

const SectionLabel = ({ label, collapsed }) => !collapsed ? (
  <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, padding: '12px 8px 4px', textTransform: 'uppercase' }}>{label}</div>
) : null;

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen && setMobileOpen(false);

  return (
    <div
      className={`admin-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      style={{
        width: collapsed ? 64 : 240,
        minHeight: '100vh',
        background: 'var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .3s, transform .3s',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: collapsed ? 'row' : 'column', alignItems: 'center', gap: 6 }}>
        <img src="/pes-logo.png" alt="PESUIMSR" style={{ width: collapsed ? 36 : '100%', height: collapsed ? 36 : 56, objectFit: 'contain' }} />
        {!collapsed && <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>AttendPro</div>}
        <button
          onClick={() => { setCollapsed(!collapsed); closeMobile(); }}
          style={{ marginLeft: collapsed ? 'auto' : undefined, alignSelf: collapsed ? 'center' : 'flex-end', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 18, padding: 4 }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <SectionLabel label="Main" collapsed={collapsed} />
        <NavItem to="/dashboard" label="Dashboard" collapsed={collapsed} onClick={closeMobile} />

        <SectionLabel label="Management" collapsed={collapsed} />
        <NavItem to="/employees"   label="Employees"   collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/departments" label="Departments" collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/shifts"      label="Shifts"      collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/devices"     label="Devices"     collapsed={collapsed} onClick={closeMobile} />

        <SectionLabel label="Attendance & Leave" collapsed={collapsed} />
        <NavItem to="/attendance"           label="Attendance"       collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/attendance-simulator" label="Simulator"        collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/leave-management"     label="Leave Management" collapsed={collapsed} onClick={closeMobile} />

        <SectionLabel label="Analytics" collapsed={collapsed} />
        <NavItem to="/reports"  label="Reports"  collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/alerts"   label="Alerts"   collapsed={collapsed} onClick={closeMobile} />
        <NavItem to="/settings" label="Settings" collapsed={collapsed} onClick={closeMobile} />
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        {!collapsed && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--info)', fontWeight: 600 }}>
          {!collapsed ? <span>Logout</span> : <span style={{ fontSize: 12, fontWeight: 700 }}>Lo</span>}
        </button>
      </div>
    </div>
  );
}
