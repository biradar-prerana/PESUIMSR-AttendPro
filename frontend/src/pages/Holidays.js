import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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
      else await api.post('/holidays', form);
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
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
            {holiday ? 'Edit Holiday' : 'Add Holiday'}
          </div>
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

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(null); // null | 'add' | holiday object
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/holidays?year=${year}`);
      setHolidays(res.data);
    } catch { toast.error('Failed to load holidays'); }
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

  // group holidays by month
  const grouped = MONTHS.map((month, idx) => ({
    month,
    items: holidays.filter(h => new Date(h.date).getMonth() === idx)
  })).filter(g => g.items.length > 0);

  const yearOptions = [];
  for (let y = new Date().getFullYear() - 1; y <= new Date().getFullYear() + 2; y++) yearOptions.push(y);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Holiday Calendar</div>
          <div className="page-subtitle">{holidays.length} holidays in {year}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 110, padding: '8px 12px' }}
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
          >
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
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 20 }}>Click "Add Holiday" to set up the holiday calendar for this year.</div>
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add First Holiday</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {grouped.map(({ month, items }) => (
            <div key={month} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
                {month} {year}
                <span style={{ float: 'right', background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '1px 9px', fontSize: 12, fontWeight: 600 }}>
                  {items.length}
                </span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {items.map(h => {
                  const d = new Date(h.date);
                  const dayName = DAYS[d.getDay()];
                  const dateNum = d.getDate();
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={h._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      borderBottom: '1px solid var(--gray-100)'
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                        background: isWeekend ? '#fef3c7' : '#dbeafe',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: isWeekend ? '#92400e' : '#1e40af', lineHeight: 1 }}>{dateNum}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: isWeekend ? '#b45309' : '#3b82f6' }}>{dayName}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)' }}>{h.name}</div>
                        {h.description && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setModal(h)}
                          style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}
                        >Edit</button>
                        <button
                          onClick={() => setDeleteTarget(h)}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#f87171', fontWeight: 600 }}
                        >Del</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <HolidayModal
          holiday={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--danger)' }}>Delete Holiday</div>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
