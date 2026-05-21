import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const SEVERITY = { Low: 'badge-info', Medium: 'badge-warning', High: 'badge-danger', Critical: 'badge-danger' };
const TYPE_ICON = { 'Unauthorized Access': '🚫', 'Device Offline': '📡', 'Late CheckIn': '⏰', 'Early CheckOut': '⬅️', 'Tailgating': '👥', 'Door Forced': '🚨', 'Invalid Credential': '❌' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ isResolved: 'false', severity: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filter).toString();
      const res = await api.get(`/alerts?${params}`);
      setAlerts(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetch();
    const socket = io('http://localhost:5000');
    socket.on('access_event', (ev) => {
      if (ev.alert) {
        toast.error(`🚫 ${ev.alert.message}`, { duration: 5000 });
        fetch();
      }
    });
    return () => socket.disconnect();
  }, [filter]);

  const markRead = async (id) => { await api.put(`/alerts/${id}/read`); fetch(); };
  const resolve = async (id) => { await api.put(`/alerts/${id}/resolve`); toast.success('Alert resolved'); fetch(); };
  const markAllRead = async () => { await api.put('/alerts/mark-all-read'); fetch(); };
  const deleteAlert = async (id) => { await api.delete(`/alerts/${id}`); fetch(); };

  const unresolved = alerts.filter(a => !a.isResolved).length;
  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Alerts & Notifications</div>
          <div className="page-subtitle">
            {unresolved} active · {unread} unread
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && <button className="btn btn-outline" onClick={markAllRead}>Mark All Read</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filter.isResolved} onChange={e => setFilter(p => ({ ...p, isResolved: e.target.value }))}>
              <option value="false">Active (Unresolved)</option>
              <option value="true">Resolved</option>
              <option value="">All</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Severity</label>
            <select className="form-select" value={filter.severity} onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))}>
              <option value="">All Severities</option>
              {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetch}>Filter</button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading alerts...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 600, color: 'var(--gray-500)' }}>No alerts found</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Everything looks good!</div>
            </div>
          ) : alerts.map(alert => (
            <div key={alert._id} className="card fade-in" style={{ opacity: alert.isRead ? 0.85 : 1, borderLeft: `4px solid ${alert.severity === 'Critical' || alert.severity === 'High' ? 'var(--danger)' : alert.severity === 'Medium' ? 'var(--warning)' : 'var(--info)'}`, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICON[alert.type] || '⚠️'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{alert.type}</span>
                      <span className={`badge ${SEVERITY[alert.severity]}`}>{alert.severity}</span>
                      {!alert.isRead && <span className="badge badge-primary" style={{ fontSize: 11 }}>New</span>}
                      {alert.isResolved && <span className="badge badge-success">Resolved</span>}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)', flexShrink: 0 }}>
                      {new Date(alert.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>{alert.message}</div>
                  {(alert.employee || alert.door || alert.device) && (
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                      {alert.employee && <span>👤 {alert.employee.firstName} {alert.employee.lastName}</span>}
                      {alert.door && <span>🚪 {alert.door.name}</span>}
                      {alert.device && <span>📡 {alert.device.name}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!alert.isRead && <button className="btn btn-outline btn-sm" onClick={() => markRead(alert._id)}>Mark Read</button>}
                    {!alert.isResolved && <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => resolve(alert._id)}>Resolve</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteAlert(alert._id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
