import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function EmpDashboard() {
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // get employee linked to this user
        const meRes = await api.get('/auth/me');
        if (!meRes.data.employee) return;
        const empRes = await api.get(`/employees/${meRes.data.employee}`);
        setEmp(empRes.data);

        const today = new Date().toISOString().split('T')[0];
        const [attRes, leaveRes, balRes] = await Promise.all([
          api.get(`/attendance?employee=${meRes.data.employee}&startDate=${today}&endDate=${today}`),
          api.get('/leaves?status=Pending'),
          api.get(`/leaves/balance/${empRes.data.employeeId}`)
        ]);
        setTodayLog(attRes.data[0] || null);
        const recent = await api.get(`/attendance?employee=${meRes.data.employee}`);
        setRecentAttendance(recent.data.slice(0, 5));
        setPendingLeaves(leaveRes.data.slice(0, 3));
        setBalance(balRes.data);
      } catch {}
    };
    load();
  }, []);

  const STATUS_CLASS = { Present: 'badge-success', Late: 'badge-warning', Absent: 'badge-danger', 'Half Day': 'badge-info', 'On Leave': 'badge-gray' };

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Welcome back, {emp?.firstName || user?.name} 👋</div>
        <div style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        {emp && <div style={{ fontSize: 13, opacity: .7, marginTop: 2 }}>{emp.designation} · {emp.department?.name}</div>}
      </div>

      {/* Today's attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green" style={{ fontSize: 22 }}>⏰</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 2 }}>Check In</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{todayLog?.checkIn ? new Date(todayLog.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue" style={{ fontSize: 22 }}>🏁</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 2 }}>Check Out</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{todayLog?.checkOut ? new Date(todayLog.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange" style={{ fontSize: 22 }}>⌛</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 2 }}>Hours Today</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{todayLog?.workingHours ? `${todayLog.workingHours}h` : '0h'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green" style={{ fontSize: 22 }}>📊</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 2 }}>Status</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {todayLog ? <span className={`badge ${STATUS_CLASS[todayLog.status] || 'badge-gray'}`}>{todayLog.status}</span> : <span className="badge badge-gray">Not Marked</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quick Actions */}
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/emp/mark', icon: '🖐️', label: 'Mark Attendance', color: 'var(--primary)', desc: 'Check in or check out' },
              { to: '/emp/apply-leave', icon: '📝', label: 'Apply for Leave', color: 'var(--accent)', desc: 'Submit a leave request' },
              { to: '/emp/attendance', icon: '📋', label: 'View Attendance', color: 'var(--success)', desc: 'See your history' },
              { to: '/emp/leave-balance', icon: '💰', label: 'Leave Balance', color: '#7c3aed', desc: 'Check remaining leaves' },
            ].map(({ to, icon, label, color, desc }) => (
              <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--gray-300)', fontSize: 18 }}>›</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            Recent Attendance
            <Link to="/emp/attendance" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>View All →</Link>
          </div>
          {recentAttendance.length === 0
            ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-300)' }}>No records yet</div>
            : recentAttendance.map(a => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'} →{' '}
                    {a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </div>
                </div>
                <span className={`badge ${STATUS_CLASS[a.status] || 'badge-gray'}`}>{a.status}</span>
              </div>
            ))}
        </div>

        {/* Leave Balance mini */}
        {balance && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Leave Balance (This Year)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {Object.entries(balance).map(([type, b]) => (
                <div key={type} style={{ padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{type}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 22, color: b.remaining > 0 ? 'var(--primary)' : 'var(--danger)' }}>{b.remaining}</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>/ {b.entitled}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 4, marginTop: 8 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: b.remaining > 0 ? 'var(--primary)' : 'var(--danger)', width: `${Math.max(0, (b.remaining / b.entitled) * 100)}%`, transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
