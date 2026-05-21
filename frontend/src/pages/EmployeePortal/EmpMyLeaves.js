import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS = { Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger' };

export default function EmpMyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves${filter ? `?status=${filter}` : ''}`);
      setLeaves(res.data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">My Leave Applications</div><div className="page-subtitle">{leaves.length} applications</div></div>
        <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Status</option>
          <option>Pending</option><option>Approved</option><option>Rejected</option>
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leaves.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 600, color: 'var(--gray-500)' }}>No leave applications found</div>
            </div>
          ) : leaves.map(l => (
            <div key={l._id} className="card fade-in" style={{ borderLeft: `4px solid ${l.status === 'Approved' ? 'var(--success)' : l.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{l.type}</span>
                    <span className={`badge ${STATUS[l.status]}`}>{l.status}</span>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>{l.days} day{l.days > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                    📅 {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: l.reviewNote ? 6 : 0 }}>
                    <span style={{ fontWeight: 500 }}>Reason:</span> {l.reason}
                  </div>
                  {l.reviewNote && (
                    <div style={{ fontSize: 13, color: l.status === 'Rejected' ? 'var(--danger)' : 'var(--success)', marginTop: 6, background: l.status === 'Rejected' ? '#fee2e2' : '#d1fae5', padding: '6px 10px', borderRadius: 6 }}>
                      <span style={{ fontWeight: 600 }}>Review Note:</span> {l.reviewNote}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Applied {new Date(l.appliedAt).toLocaleDateString('en-IN')}</div>
                  {l.reviewedAt && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Reviewed {new Date(l.reviewedAt).toLocaleDateString('en-IN')}</div>}
                  {l.reviewedBy && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>by {l.reviewedBy.name}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
