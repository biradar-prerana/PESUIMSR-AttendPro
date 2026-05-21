import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const LEAVE_TYPES = ['Casual Leave', 'Earned Leave', 'Maternity Leave', 'Emergency Leave'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function EmpApplyLeave() {
  const [form, setForm] = useState({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
  const [days, setDays] = useState(0);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empId, setEmpId] = useState(null);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const year = new Date().getFullYear();
    api.get(`/holidays?year=${year}`).then(r => setHolidays(r.data)).catch(() => {});
    api.get('/auth/me').then(async res => {
      if (!res.data.employee) return;
      const empRes = await api.get(`/employees/${res.data.employee}`);
      setEmpId(empRes.data.employeeId);
      const bal = await api.get(`/leaves/balance/${empRes.data.employeeId}`);
      setBalance(bal.data);
    });
  }, []);

  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const from = new Date(form.fromDate);
      const to   = new Date(form.toDate);
      if (to < from) { setDays(0); return; }
      let count = 0;
      const cur = new Date(from);
      while (cur <= to) { if (cur.getDay() !== 0) count++; cur.setDate(cur.getDate() + 1); }
      setDays(count);
    }
  }, [form.fromDate, form.toDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate || !form.reason) return toast.error('Fill all fields');
    if (days <= 0) return toast.error('Invalid date range');
    const bal = balance?.[form.type]?.remaining;
    if (bal !== undefined && days > bal) return toast.error(`Only ${bal} days remaining for ${form.type}`);
    setLoading(true);
    try {
      await api.post('/leaves/apply', { ...form });
      toast.success('Leave applied successfully!');
      setForm({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
      setDays(0);
      const bal2 = await api.get(`/leaves/balance/${empId}`);
      setBalance(bal2.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  // upcoming holidays (from today onwards, limit 6)
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = holidays.filter(h => new Date(h.date) >= today).slice(0, 6);
  const past     = holidays.filter(h => new Date(h.date) < today);

  return (
    <div className="fade-in">
      <div className="page-header"><div className="page-title">Apply for Leave</div></div>

      <div className="apply-leave-grid">

        {/* ── Leave Application Form ── */}
        <div className="card">
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 20 }}>Leave Application</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {balance && balance[form.type] && (
                <div style={{ fontSize: 12, color: balance[form.type].remaining > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4, fontWeight: 500 }}>
                  Available: {balance[form.type].remaining} / {balance[form.type].entitled} days
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input className="form-input" type="date" value={form.fromDate} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, fromDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input className="form-input" type="date" value={form.toDate} min={form.fromDate || new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))} required />
              </div>
            </div>
            {days > 0 && (
              <div style={{ background: '#dbeafe', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                📅 {days} working day{days > 1 ? 's' : ''} selected
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-input" rows={4} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Describe the reason for your leave..." required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Submitting...' : '📝 Submit Leave Application'}
            </button>
          </form>
        </div>

        {/* ── Leave Balance ── */}
        {balance && (
          <div className="card" style={{ height: 'fit-content' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16, marginBottom: 16 }}>Leave Balance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(balance).map(([type, b]) => (
                <div key={type} style={{ padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{type}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: b.remaining > 0 ? 'var(--primary)' : 'var(--danger)' }}>{b.remaining} / {b.entitled}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--gray-200)', borderRadius: 4 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: b.remaining > 3 ? 'var(--success)' : b.remaining > 0 ? 'var(--warning)' : 'var(--danger)', width: `${Math.max(0, (b.remaining / b.entitled) * 100)}%`, transition: 'width .4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{b.taken} days taken</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Holiday Calendar ── */}
        <div className="card" style={{ height: 'fit-content', padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '12px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Holiday Calendar</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{new Date().getFullYear()} — {holidays.length} holidays</div>
          </div>

          {holidays.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No holidays added yet</div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upcoming</div>
                  {upcoming.map(h => <HolidayRow key={h._id} h={h} highlight />)}
                </>
              )}

              {/* Past */}
              {past.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Past</div>
                  {past.map(h => <HolidayRow key={h._id} h={h} />)}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function HolidayRow({ h, highlight }) {
  const d = new Date(h.date);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
      borderBottom: '1px solid var(--gray-100)',
      background: highlight ? '#f0fdf4' : 'transparent',
      opacity: highlight ? 1 : 0.65
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: highlight ? '#bbf7d0' : 'var(--gray-100)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: highlight ? '#166534' : 'var(--gray-500)', lineHeight: 1 }}>{d.getDate()}</div>
        <div style={{ fontSize: 9, fontWeight: 600, color: highlight ? '#16a34a' : 'var(--gray-400)' }}>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? '#166534' : 'var(--gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}
        </div>
      </div>
    </div>
  );
}
