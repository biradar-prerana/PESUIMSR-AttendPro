import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../utils/api';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="stat-card fade-in">
    <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-800)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="pulse" style={{ fontSize: 14, color: 'var(--gray-400)' }}>Loading dashboard...</div></div>;

  return (
    <div className="fade-in">
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Employees" value={stats?.totalEmployees ?? 0} color="blue" />
        <StatCard icon="✅" label="Present Today" value={stats?.presentToday ?? 0} color="green" sub={`${stats?.lateToday ?? 0} late`} />
        <StatCard icon="📡" label="Active Devices" value={stats?.activeDevices ?? 0} color="orange" />
        <StatCard icon="🔔" label="Active Alerts" value={stats?.alertsToday ?? 0} color="red" sub={`${stats?.accessDeniedToday ?? 0} access denied`} />
      </div>

      <div className="dashboard-grid">
        {/* Weekly Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>Weekly Attendance</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Last 7 days overview</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="count" fill="#1F3F7A" radius={[6, 6, 0, 0]} name="Present" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Summary */}
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Today's Summary</div>
          {[
            { label: 'Present', value: stats?.presentToday ?? 0, color: 'var(--success)', bg: '#d1fae5' },
            { label: 'Late Arrivals', value: stats?.lateToday ?? 0, color: 'var(--warning)', bg: '#fef3c7' },
            { label: 'Absent', value: (stats?.totalEmployees ?? 0) - (stats?.presentToday ?? 0), color: 'var(--danger)', bg: '#fee2e2' },
            { label: 'Access Granted', value: stats?.accessGranted ?? 0, color: 'var(--info)', bg: '#dbeafe' },
            { label: 'Access Denied', value: stats?.accessDeniedToday ?? 0, color: '#7c3aed', bg: '#ede9fe' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>{label}</span>
              <span style={{ background: bg, color, fontWeight: 700, padding: '3px 12px', borderRadius: 20, fontSize: 14 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Access Logs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>Recent Access Events</div>
          <a href="/access-logs" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View All →</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Door</th>
                <th>Direction</th>
                <th>Method</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentAccess || []).length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No access events today</td></tr>
              ) : (stats?.recentAccess || []).map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                        {log.employee?.firstName?.charAt(0) || '?'}
                      </div>
                      <span>{log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{log.door?.name || '-'}</td>
                  <td><span className={`badge ${log.direction === 'In' ? 'badge-success' : 'badge-info'}`}>{log.direction}</span></td>
                  <td style={{ color: 'var(--gray-500)' }}>{log.method || '-'}</td>
                  <td><span className={`badge ${log.status === 'Granted' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
