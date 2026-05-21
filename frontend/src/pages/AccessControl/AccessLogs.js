import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doors, setDoors] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', door: '', status: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const [logsRes, doorsRes] = await Promise.all([api.get(`/access/logs?${params}`), api.get('/doors')]);
      setLogs(logsRes.data); setDoors(doorsRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const exportCSV = () => {
    const headers = ['Employee', 'Employee ID', 'Door', 'Direction', 'Method', 'Status', 'Time'];
    const rows = logs.map(l => [
      l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unknown',
      l.employee?.employeeId || '-', l.door?.name || '-', l.direction, l.method || '-', l.status,
      new Date(l.timestamp).toLocaleString('en-IN')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'access_logs.csv'; a.click();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Access Logs</div><div className="page-subtitle">{logs.length} records</div></div>
        <button className="btn btn-accent" onClick={exportCSV}>⬇️ Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From</label>
            <input className="form-input" type="datetime-local" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To</label>
            <input className="form-input" type="datetime-local" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Door</label>
            <select className="form-select" value={filters.door} onChange={e => setFilters(p => ({ ...p, door: e.target.value }))}>
              <option value="">All Doors</option>
              {doors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="">All</option><option>Granted</option><option>Denied</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetch}>Search</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading...</div> : (
            <table>
              <thead>
                <tr><th>Employee</th><th>Door</th><th>Direction</th><th>Method</th><th>Status</th><th>Reason</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No access logs found</td></tr>
                ) : logs.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {l.employee?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unknown'}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.employee?.employeeId || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>🚪 {l.door?.name || '-'}</td>
                    <td><span className={`badge ${l.direction === 'In' ? 'badge-success' : 'badge-info'}`}>{l.direction}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{l.method || '-'}</td>
                    <td><span className={`badge ${l.status === 'Granted' ? 'badge-success' : 'badge-danger'}`}>{l.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{l.reason || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(l.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
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
