import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_CLASS = { Present: 'badge-success', Late: 'badge-warning', Absent: 'badge-danger', 'Half Day': 'badge-info', 'On Leave': 'badge-gray', Holiday: 'badge-primary' };

export default function EmpAttendance() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empId, setEmpId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.get('/auth/me').then(async res => {
      if (!res.data.employee) return;
      const empRes = await api.get(`/employees/${res.data.employee}`);
      setEmpId(empRes.data.employeeId);
      if (empRes.data.employeeId) loadData(empRes.data, month);
    });
  }, []);

  const loadData = async (emp, m) => {
    setLoading(true);
    try {
      const [y, mo] = m.split('-');
      const start = `${y}-${mo}-01`;
      const end   = new Date(y, mo, 0).toISOString().split('T')[0];
      const [logsRes, sumRes] = await Promise.all([
        api.get(`/attendance?employee=${emp._id || emp}&startDate=${start}&endDate=${end}`),
        api.get(`/attendance/summary/${emp.employeeId || empId}`)
      ]);
      setLogs(logsRes.data);
      setSummary(sumRes.data);
    } catch {} finally { setLoading(false); }
  };

  const handleMonthChange = async (m) => {
    setMonth(m);
    const me = await api.get('/auth/me');
    if (me.data.employee) loadData(me.data.employee, m);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">My Attendance</div></div>
        <input type="month" className="form-input" value={month} onChange={e => handleMonthChange(e.target.value)} style={{ width: 180 }} />
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            ['✅ Present', summary.present, '#d1fae5', '#065f46'],
            ['⏰ Late', summary.late, '#fef3c7', '#92400e'],
            ['❌ Absent', summary.absent, '#fee2e2', '#991b1b'],
            ['🌓 Half Day', summary.halfDay, '#dbeafe', '#1e40af'],
            ['🏖️ On Leave', summary.onLeave, '#ede9fe', '#5b21b6'],
            ['⌛ Total Hrs', summary.totalWorkingHours + 'h', '#f0fdf4', '#166534'],
          ].map(([label, val, bg, color]) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading...</div> : (
            <table>
              <thead><tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No records for this month</td></tr>
                  : logs.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 500 }}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                      <td style={{ fontSize: 13, color: a.status === 'Late' ? 'var(--warning)' : 'inherit', fontWeight: a.status === 'Late' ? 600 : 400 }}>
                        {a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ fontSize: 13 }}>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{a.workingHours ? `${a.workingHours}h` : '-'}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.checkInMethod || '-'}</td>
                      <td><span className={`badge ${STATUS_CLASS[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
