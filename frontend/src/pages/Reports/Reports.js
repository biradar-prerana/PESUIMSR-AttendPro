import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#1F3F7A'];

export default function Reports() {
  const [tab, setTab] = useState('attendance');
  const [summary, setSummary] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', department: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/reports/summary').then(r => setSummary(r.data));
    api.get('/departments').then(r => setDepartments(r.data));
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/reports/attendance?${params}`);
    setAttendanceLogs(res.data);
    setLoading(false);
  };

  const fetchAccess = async () => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    const res = await api.get(`/reports/access?${params}`);
    setAccessLogs(res.data);
    setLoading(false);
  };

  const exportCSV = (data, filename, headers, rowFn) => {
    const csv = [headers, ...data.map(rowFn)].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const statusData = summary ? [
    { name: 'Present', value: summary.presentToday },
    { name: 'Absent', value: summary.totalEmployees - summary.presentToday },
    { name: 'Late', value: summary.lateToday }
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">Reports & Analytics</div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            ['👥', 'Total Employees', summary.totalEmployees, 'blue'],
            ['✅', 'Present Today', summary.presentToday, 'green'],
            ['⏰', 'Late Today', summary.lateToday, 'orange'],
            ['❌', 'Absent Today', summary.totalEmployees - summary.presentToday, 'red'],
            ['🔓', 'Access Granted', summary.accessGranted, 'green'],
            ['🚫', 'Access Denied', summary.accessDenied, 'red'],
          ].map(([icon, label, val, color]) => (
            <div key={label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>Attendance This Month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1F3F7A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>Today's Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['attendance', '📅 Attendance'], ['access', '🔐 Access']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className="btn btn-sm" style={{ background: tab === t ? 'var(--primary)' : 'var(--gray-100)', color: tab === t ? 'white' : 'var(--gray-600)' }}>{l}</button>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">From</label><input className="form-input" type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} /></div>
          <div className="form-group" style={{ margin: 0 }}><label className="form-label">To</label><input className="form-input" type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} /></div>
          {tab === 'attendance' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department</label>
              <select className="form-select" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
                <option value="">All</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={tab === 'attendance' ? fetchAttendance : fetchAccess}>Generate Report</button>
          {(attendanceLogs.length > 0 || accessLogs.length > 0) && (
            <button className="btn btn-accent" onClick={() => {
              if (tab === 'attendance') exportCSV(attendanceLogs, 'attendance_report.csv', ['Employee','ID','Dept','Date','CheckIn','CheckOut','Hours','Status'], l => [`${l.employee?.firstName} ${l.employee?.lastName}`, l.employee?.employeeId, l.employee?.department?.name, new Date(l.date).toLocaleDateString(), l.checkIn ? new Date(l.checkIn).toLocaleTimeString() : '-', l.checkOut ? new Date(l.checkOut).toLocaleTimeString() : '-', l.workingHours || '-', l.status]);
              else exportCSV(accessLogs, 'access_report.csv', ['Employee','ID','Door','Direction','Method','Status','Time'], l => [`${l.employee?.firstName||''} ${l.employee?.lastName||''}`, l.employee?.employeeId || '-', l.door?.name || '-', l.direction, l.method || '-', l.status, new Date(l.timestamp).toLocaleString()]);
            }}>⬇️ Export CSV</button>
          )}
        </div>

        <div className="table-wrap">
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Generating report...</div> : (
            tab === 'attendance' ? (
              <table>
                <thead><tr><th>Employee</th><th>Dept</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {attendanceLogs.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Select filters and generate report</td></tr>
                    : attendanceLogs.map(l => (
                      <tr key={l._id}>
                        <td><div style={{ fontWeight: 500 }}>{l.employee?.firstName} {l.employee?.lastName}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.employee?.employeeId}</div></td>
                        <td style={{ fontSize: 13 }}>{l.employee?.department?.name || '-'}</td>
                        <td style={{ fontSize: 13 }}>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: 13 }}>{l.checkIn ? new Date(l.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td style={{ fontSize: 13 }}>{l.checkOut ? new Date(l.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{l.workingHours ? `${l.workingHours}h` : '-'}</td>
                        <td><span className={`badge ${l.status === 'Present' ? 'badge-success' : l.status === 'Late' ? 'badge-warning' : l.status === 'Absent' ? 'badge-danger' : 'badge-info'}`}>{l.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead><tr><th>Employee</th><th>Door</th><th>Direction</th><th>Method</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {accessLogs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Select filters and generate report</td></tr>
                    : accessLogs.map(l => (
                      <tr key={l._id}>
                        <td><div style={{ fontWeight: 500 }}>{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unknown'}</div></td>
                        <td style={{ fontSize: 13 }}>{l.door?.name || '-'}</td>
                        <td><span className={`badge ${l.direction === 'In' ? 'badge-success' : 'badge-info'}`}>{l.direction}</span></td>
                        <td style={{ fontSize: 13 }}>{l.method || '-'}</td>
                        <td><span className={`badge ${l.status === 'Granted' ? 'badge-success' : 'badge-danger'}`}>{l.status}</span></td>
                        <td style={{ fontSize: 13 }}>{new Date(l.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
