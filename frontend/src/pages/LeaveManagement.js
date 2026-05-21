import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLOR = { Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Holiday modal (add / edit) ────────────────────────────────────────────────
function HolidayModal({ holiday, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: holiday?.name || '',
    date: holiday?.date ? holiday.date.split('T')[0] : '',
    description: holiday?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (holiday) await api.put(`/holidays/${holiday._id}`, form);
      else         await api.post('/holidays', form);
      toast.success(`Holiday ${holiday ? 'updated' : 'added'} successfully!`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{holiday ? 'Edit Holiday' : 'Add Holiday'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Holiday Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Republic Day" />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : holiday ? 'Update' : 'Add Holiday'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Holiday Calendar tab ──────────────────────────────────────────────────────
function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(`/holidays?year=${year}`); setHolidays(r.data); }
    catch { toast.error('Failed to load holidays'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year]);

  const handleDelete = async () => {
    try {
      await api.delete(`/holidays/${deleteTarget._id}`);
      toast.success('Holiday deleted');
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const grouped = MONTHS.map((month, idx) => ({
    month,
    items: holidays.filter(h => new Date(h.date).getMonth() === idx)
  })).filter(g => g.items.length > 0);

  const yearOptions = [];
  for (let y = new Date().getFullYear() - 1; y <= new Date().getFullYear() + 2; y++) yearOptions.push(y);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{holidays.length} holidays in {year}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-select" style={{ width: 110, padding: '8px 12px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Holiday</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>
      ) : holidays.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
          <div style={{ fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>No holidays added for {year}</div>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 20 }}>Click "Add Holiday" to set up the holiday calendar for employees.</div>
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add First Holiday</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {grouped.map(({ month, items }) => (
            <div key={month} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {month} {year}
                <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '1px 9px', fontSize: 12, fontWeight: 600 }}>{items.length}</span>
              </div>
              {items.map(h => {
                const d = new Date(h.date);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: isWeekend ? '#fef3c7' : '#dbeafe',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: isWeekend ? '#92400e' : '#1e40af', lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isWeekend ? '#b45309' : '#3b82f6' }}>{DAYS[d.getDay()]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)' }}>{h.name}</div>
                      {h.description && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setModal(h)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => setDeleteTarget(h)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#f87171', fontWeight: 600 }}>Del</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {modal && <HolidayModal holiday={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}

      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--danger)' }}>Delete Holiday</div>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main LeaveManagement page ─────────────────────────────────────────────────
export default function LeaveManagement() {
  const [tab, setTab] = useState('leaves'); // 'leaves' | 'holidays'
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves${filter ? `?status=${filter}` : ''}`);
      setLeaves(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'leaves') load(); }, [filter, tab]);

  const handleReview = async (status) => {
    try {
      await api.put(`/leaves/${reviewModal._id}/review`, { status, reviewNote });
      toast.success(`Leave ${status.toLowerCase()}!`);
      setReviewModal(null); setReviewNote('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const pending = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Leave Management</div>
          <div className="page-subtitle">{tab === 'leaves' ? `${pending} pending approval` : 'Manage public holidays for employees'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--gray-200)', paddingBottom: 0 }}>
        {[
          { key: 'leaves',   label: `Leave Requests${pending > 0 ? ` (${pending})` : ''}` },
          { key: 'holidays', label: 'Holiday Calendar' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              color: tab === t.key ? 'var(--primary)' : 'var(--gray-400)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all .15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Leave Requests tab ── */}
      {tab === 'leaves' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Pending', 'Approved', 'Rejected', ''].map((s, i) => (
              <button key={i} onClick={() => setFilter(s)} className="btn btn-sm"
                style={{ background: filter === s ? 'var(--primary)' : 'var(--gray-100)', color: filter === s ? 'white' : 'var(--gray-600)' }}>
                {s || 'All'}{s === 'Pending' && pending > 0 ? ` (${pending})` : ''}
              </button>
            ))}
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaves.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600, color: 'var(--gray-500)' }}>No {filter.toLowerCase()} leave applications</div>
                </div>
              ) : leaves.map(l => (
                <div key={l._id} className="card fade-in" style={{ borderLeft: `4px solid ${l.status === 'Approved' ? 'var(--success)' : l.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {l.employee?.photo
                        ? <img src={`http://localhost:5000${l.employee.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: 'white', fontWeight: 700 }}>{l.employee?.firstName?.charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{l.employee?.firstName} {l.employee?.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{l.employee?.employeeId}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${STATUS_COLOR[l.status]}`}>{l.status}</span>
                          <span className="badge badge-info">{l.days} day{l.days > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{l.type}</span>
                        <span style={{ color: 'var(--gray-500)' }}>📅 {new Date(l.fromDate).toLocaleDateString('en-IN')} → {new Date(l.toDate).toLocaleDateString('en-IN')}</span>
                        <span style={{ color: 'var(--gray-400)' }}>Applied: {new Date(l.appliedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 6 }}><strong>Reason:</strong> {l.reason}</div>
                      {l.reviewNote && <div style={{ fontSize: 13, marginTop: 6, padding: '6px 10px', background: l.status === 'Rejected' ? '#fee2e2' : '#d1fae5', borderRadius: 6, color: l.status === 'Rejected' ? '#991b1b' : '#065f46' }}><strong>Note:</strong> {l.reviewNote}</div>}
                      {l.status === 'Pending' && (
                        <div style={{ marginTop: 12 }}>
                          <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', marginRight: 8 }} onClick={() => setReviewModal(l)}>
                            ✅ Approve / Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Holiday Calendar tab ── */}
      {tab === 'holidays' && <HolidayCalendar />}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Review Leave Application</div>
              <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
                <div><strong>{reviewModal.employee?.firstName} {reviewModal.employee?.lastName}</strong> — {reviewModal.type}</div>
                <div style={{ color: 'var(--gray-500)', marginTop: 2 }}>{new Date(reviewModal.fromDate).toLocaleDateString()} → {new Date(reviewModal.toDate).toLocaleDateString()} ({reviewModal.days} days)</div>
                <div style={{ marginTop: 4 }}><strong>Reason:</strong> {reviewModal.reason}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Review Note (optional)</label>
                <textarea className="form-input" rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add a note for the employee..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReview('Rejected')}>❌ Reject</button>
              <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => handleReview('Approved')}>✅ Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
