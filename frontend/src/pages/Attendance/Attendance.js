import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], department: '', status: '' });
  const [editModal, setEditModal] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const [logsRes, deptRes] = await Promise.all([api.get(`/attendance?${params}`), api.get('/departments')]);
      setLogs(logsRes.data); setDepartments(deptRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const exportCSV = () => {
    const headers = ['Employee', 'ID', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
    const rows = logs.map(l => [
      l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'N/A',
      l.employee?.employeeId || '-',
      l.employee?.department?.name || '-',
      new Date(l.date).toLocaleDateString('en-IN'),
      l.checkIn ? new Date(l.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
      l.checkOut ? new Date(l.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
      l.workingHours || '-', l.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  };

  const STATUS_CLASS = { Present: 'badge-success', Late: 'badge-warning', Absent: 'badge-danger', 'Half Day': 'badge-info', 'On Leave': 'badge-gray', Holiday: 'badge-primary' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Attendance</div><div className="page-subtitle">{logs.length} records</div></div>
        <button className="btn btn-accent" onClick={exportCSV}>⬇️ Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department</label>
            <select className="form-select" value={filters.department} onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="">All</option>
              {['Present','Late','Absent','Half Day','On Leave','Holiday'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetch}>Search</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading...</div> : (
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Method</th><th>Status</th><th>Edit</th></tr></thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No records found</td></tr>
                ) : logs.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                          {l.employee?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'N/A'}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.employee?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{l.employee?.department?.name || '-'}</td>
                    <td style={{ fontSize: 13 }}>{new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td style={{ fontSize: 13, color: l.status === 'Late' ? 'var(--warning)' : 'inherit', fontWeight: l.status === 'Late' ? 600 : 400 }}>{l.checkIn ? new Date(l.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ fontSize: 13 }}>{l.checkOut ? new Date(l.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{l.workingHours ? `${l.workingHours}h` : '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{l.checkInMethod || '-'}</td>
                    <td><span className={`badge ${STATUS_CLASS[l.status] || 'badge-gray'}`}>{l.status}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditModal(l)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editModal && (
        <EditAttendanceModal log={editModal} onClose={() => setEditModal(null)} onSaved={() => { setEditModal(null); fetch(); }} />
      )}
    </div>
  );
}

function EditAttendanceModal({ log, onClose, onSaved }) {
  const [form, setForm] = useState({
    checkIn: log.checkIn ? new Date(log.checkIn).toISOString().slice(0, 16) : '',
    checkOut: log.checkOut ? new Date(log.checkOut).toISOString().slice(0, 16) : '',
    status: log.status, remarks: log.remarks || ''
  });

  const handleSave = async () => {
    try {
      const data = { ...form };
      if (form.checkIn && form.checkOut) {
        const diff = (new Date(form.checkOut) - new Date(form.checkIn)) / 3600000;
        data.workingHours = parseFloat(diff.toFixed(2));
      }
      await api.put(`/attendance/${log._id}`, data);
      toast.success('Attendance updated!');
      onSaved();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Edit Attendance</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--gray-600)' }}>{log.employee?.firstName} {log.employee?.lastName} — {new Date(log.date).toLocaleDateString()}</div>
          <div className="form-group"><label className="form-label">Check In</label><input className="form-input" type="datetime-local" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Check Out</label><input className="form-input" type="datetime-local" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['Present','Late','Absent','Half Day','On Leave','Holiday'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Remarks</label><input className="form-input" value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
