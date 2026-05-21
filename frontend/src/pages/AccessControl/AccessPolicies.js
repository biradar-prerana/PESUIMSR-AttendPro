import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','All'];

export default function AccessPolicies() {
  const [policies, setPolicies] = useState([]);
  const [doors, setDoors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', doors: [], departments: [], timeSlots: [{ day: 'All', startTime: '08:00', endTime: '20:00' }], validFrom: '', validTo: '', isActive: true });

  const fetch = () => Promise.all([api.get('/access/policies'), api.get('/doors'), api.get('/departments')]).then(([p, d, dept]) => { setPolicies(p.data); setDoors(d.data); setDepartments(dept.data); });
  useEffect(() => { fetch(); }, []);

  const open = (p) => {
    setEdit(p || null);
    setForm(p ? { ...p, doors: p.doors?.map(d => d._id || d) || [], departments: p.departments?.map(d => d._id || d) || [], validFrom: p.validFrom?.split('T')[0] || '', validTo: p.validTo?.split('T')[0] || '' } : { name: '', description: '', doors: [], departments: [], timeSlots: [{ day: 'All', startTime: '08:00', endTime: '20:00' }], validFrom: '', validTo: '', isActive: true });
    setShowModal(true);
  };

  const toggleArr = (field, val) => setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(x => x !== val) : [...p[field], val] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit) await api.put(`/access/policies/${edit._id}`, form);
      else await api.post('/access/policies', form);
      toast.success(`Policy ${edit ? 'updated' : 'created'}!`);
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><div className="page-title">Access Policies</div><div className="page-subtitle">{policies.length} policies configured</div></div>
        <button className="btn btn-primary" onClick={() => open(null)}>+ Add Policy</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {policies.map(p => (
          <div key={p._id} className="card fade-in" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>🔐 {p.name}</div>
              <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            {p.description && <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10 }}>{p.description}</div>}
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Doors: </span>
              {p.doors?.length > 0 ? p.doors.map(d => <span key={d._id} className="badge badge-info" style={{ fontSize: 11, marginRight: 4 }}>{d.name}</span>) : <span className="badge badge-gray" style={{ fontSize: 11 }}>All Doors</span>}
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Departments: </span>
              {p.departments?.length > 0 ? p.departments.map(d => <span key={d._id} className="badge badge-primary" style={{ fontSize: 11, marginRight: 4 }}>{d.name}</span>) : <span className="badge badge-gray" style={{ fontSize: 11 }}>All</span>}
            </div>
            {p.timeSlots?.length > 0 && (
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Time: </span>
                {p.timeSlots.map((t, i) => <span key={i} style={{ fontSize: 12, color: 'var(--gray-500)' }}>{t.day}: {t.startTime}-{t.endTime} </span>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-outline btn-sm" onClick={() => open(p)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={async () => { if (window.confirm('Delete policy?')) { await api.delete(`/access/policies/${p._id}`); fetch(); } }}>Delete</button>
            </div>
          </div>
        ))}
        {policies.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>No access policies yet.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{edit ? 'Edit Policy' : 'Add Access Policy'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Policy Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                <div className="form-group">
                  <label className="form-label">Doors (select applicable)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {doors.map(d => (
                      <button key={d._id} type="button" onClick={() => toggleArr('doors', d._id)} className="btn btn-sm" style={{ background: form.doors.includes(d._id) ? 'var(--primary)' : 'var(--gray-100)', color: form.doors.includes(d._id) ? 'white' : 'var(--gray-600)' }}>
                        🚪 {d.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Departments</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {departments.map(d => (
                      <button key={d._id} type="button" onClick={() => toggleArr('departments', d._id)} className="btn btn-sm" style={{ background: form.departments.includes(d._id) ? 'var(--primary)' : 'var(--gray-100)', color: form.departments.includes(d._id) ? 'white' : 'var(--gray-600)' }}>
                        🏢 {d.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  {form.timeSlots.map((slot, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <select className="form-select" value={slot.day} onChange={e => { const ts = [...form.timeSlots]; ts[i].day = e.target.value; setForm(p => ({ ...p, timeSlots: ts })); }}>
                        {DAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <input className="form-input" type="time" value={slot.startTime} onChange={e => { const ts = [...form.timeSlots]; ts[i].startTime = e.target.value; setForm(p => ({ ...p, timeSlots: ts })); }} />
                      <input className="form-input" type="time" value={slot.endTime} onChange={e => { const ts = [...form.timeSlots]; ts[i].endTime = e.target.value; setForm(p => ({ ...p, timeSlots: ts })); }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Valid From</label><input className="form-input" type="date" value={form.validFrom} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Valid To</label><input className="form-input" type="date" value={form.validTo} onChange={e => setForm(p => ({ ...p, validTo: e.target.value }))} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{edit ? 'Update' : 'Create Policy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
